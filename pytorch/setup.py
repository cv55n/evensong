# setup.py do pytorch
# variáveis de ambiente que provavelmente interesse:
#
# debug
# - build com -o0 e -g (símbolos de debug)
#
# rel_with_deb_info
# - build com otimizações e -g (símbolos de debug)
#
# use_custom_debinfo="path/para/arquivo1.cpp;path/para/arquivo2.cpp"
# - build com info de debug apenas para arquivos específicos
#
# max_jobs
# - número máximo de jobs de compilação que devemos usar para compilar o código
#
# use_cuda=0
# - desabilita a build do cuda
#
# cflags
# - flags a serem aplicadas tanto a arquivos c quanto c++ a
#   serem compilados (uma peculiaridade do setup.py que segue
#   fielmente no sistema de compilação é que cflags também se
#   aplica a arquivos c++ (a menos que cxxflags esteja
#   definido), em contraste com o comportamento padrão dos
#   sistemas de compilação autogoo e cmake)
#
#   uma flag específica que pode ser usada é:
#   - dhas_torch_show_dispatch_trace
#     - build com rastreamento de despacho que pode ser
#       habilitado com:
#       - torch_show_dispatch_trace=1 no runtime
#
# cc
# - o compilador do c/c++ a ser utilizado
#
# cmake_fresh=1
# - força uma nova execução de configuração do cmake, ignorando
#   o cache do cmake existente
#
# cmake_only=1
# - executa o cmake e para; não compila o projeto
#
# variáveis de ambiente para recursos alternados:
#
# debug_cuda=1
# - se utilizado em conjunção com debug ou rel_with_deb_info,
#   irá também realizar uma build de kernels cuda com
#   -lineinfo --source-in-ptx. note que no cuda 12 isso talvez
#   cause um nvcc em oom, então é desativado por padrão
#
# use_cudnn=0
# - desatva a build do cudnn
#
# use_cusparselt=0
# - desativa a build do cusparselt
#
# use_cudss=0
# - desativa a build do cudss
#
# use_cufile=0
# - desativa a build do cufile
#
# use_fbgemm=0
# - desativa a build do fbgemm
#
# use_fbgemm_genai=0
# - desativa a build do fbgemm genai
#
# use_kineto=0
# - desativa o uso da biblioteca libkineto para criação de perfil
#
# use_numpy=0
# - desativa a build do numpy
#
# build_test=0
# - desativa a build de teste
#
# use_mkldnn=0
# - desativa o uso de mkldnn
#
# use_mkldnn_acl
# - habilita o uso do backend da biblioteca de computação para
#   o mkldnn no arm; use_mkldnn deve estar explicitamente
#   habilitado
#
# mkldnn_cpu_runtime
# - modo de threading do mkl-dnn: tbb ou omp (padrão)
#
# use_static_mkl
# - prefira vincular estaticamente com o mkl - somente para unix
#
# use_itt=0
# - desativa o uso da funcionalidade itt do intel(r) vtune
#   profiler
#
# use_nnpack=0
# - desativa a build do nnpack

from __future__ import annotations

import os
import sys


if sys.platform == "win32" and sys.maxsize.bit_length() == 31:
    print(
        "o ambiente de execução python 32-bit para windows não é compatível. "
        "por favor, altere para o python 64-bit.",

        file=sys.stderr
    )

    sys.exit(-1)

import platform


# também atualiza `project.requires-python` em pyproject.toml
# ao alterar isso
python_min_version = (3, 10, 0)
python_min_version_str = ".".join(map(str, python_min_version))

if sys.version_info < python_min_version:
    print(
        f"você está utilizando o a versão {platform.python_version()} do python. "
        f"python >={python_min_version_str} necessário.",

        file=sys.stderr
    )

    sys.exit(-1)

import filecmp
import glob
import importlib
import itertools
import json
import shutil
import subprocess
import sysconfig
import tempfile
import textwrap
import time
import zipfile

from collections import defaultdict
from pathlib import Path
from typing import Any, ClassVar, IO

import setuptools.command.bdist_wheel
import setuptools.command.build_ext
import setuptools.command.sdist
import setuptools.errors
from setuptools import Command, Extension, find_packages, setup
from setuptools.dist import Distribution


CWD = Path(__file__).absolute().parent

# adiciona o diretório atual ao pythonpath para que se possa
# importar `tools`. isso é necessário ao executar este script
# com um backend de compilação compatível com pep-517
#
# da documentação do pep-517: https://peps.python.org/pep-0517
#
# > ao importar o path do módulo, *não* se procura no
# > diretório que contém a árvore de origem, a menos que ela
# > já esteja em `sys.path` (por exemplo, porque está
# > especificada em `pythonpath`)
sys.path.insert(0, str(CWD)) # isso apenas afeta o processo atual

# adiciona o diretório atual ao pythonpath para que se possa
# importar `tools` em subprocessos
os.environ["PYTHONPATH"] = os.pathsep.join(
    [
        str(CWD),
        os.getenv("PYTHONPATH", "")
    ]
).rstrip(os.pathsep)

from tools.build_pytorch_libs import build_pytorch
from tools.generate_torch_version import get_torch_version
from tools.setup_helpers.cmake import CMake, CMakeValue

from tools.setup_helpers.env import (
    BUILD_DIR,
    build_type,
    IS_DARWIN,
    IS_LINUX,
    IS_WINDOWS
)


def str2bool(value: str | None) -> bool:
    """converte as variáveis de ambiente em valores booleanos."""

    if not value:
        return False
    
    if not isinstance(value, str):
        raise ValueError(
            f"esperava-se um valor de string para a conversão booleana, mas obteu-se {type(value)}"
        )
    
    value = value.strip().lower()

    if value in (
        "1",
        "true",
        "t",
        "yes",
        "y",
        "on",
        "enable",
        "enabled",
        "found"
    ):
        return True
    
    if value in (
        "0",
        "false",
        "f",
        "no",
        "n",
        "off",
        "disable",
        "disabled",
        "notfound",
        "none",
        "null",
        "nil",
        "undefined",
        "n/a"
    ):
        return False
    
    raise ValueError(f"valor de string inválido para conversão booleana: {value}")


def _get_package_path(package_name: str) -> Path:
    from importlib.util import find_spec

    spec = find_spec(package_name)

    if spec:
        # o pacote deve ser um pacote de namespace, então
        # get_data talvez falhe
        try:
            loader = spec.loader

            if loader is not None:
                file_path = loader.get_filename() # type: ignore[attr-defined]

                return Path(file_path).parent
        except AttributeError:
            pass

    return CWD / package_name


BUILD_LIBTORCH_WHL = str2bool(os.getenv("BUILD_LIBTORCH_WHL"))
BUILD_PYTHON_ONLY = str2bool(os.getenv("BUILD_PYTHON_ONLY"))

if BUILD_PYTHON_ONLY:
    os.environ["BUILD_LIBTORCHLESS"] = "ON"
    os.environ["LIBTORCH_LIB_PATH"] = (_get_package_path("torch") / "lib").as_posix()

#####################################
# parâmetros analisados do ambiente #
#####################################

VERBOSE_SCRIPT = str2bool(os.getenv("VERBOSE", "1"))
RUN_BUILD_DEPS = True

# verifica se o usuário passou um parâmetro `quiet` para os
# argumentos do `setup.py` e respeita isso nas partes do
# processo de compilação
EMIT_BUILD_WARNING = False
RERUN_CMAKE = str2bool(os.environ.pop("CMAKE_FRESH", None))
CMAKE_ONLY = str2bool(os.environ.pop("CMAKE_ONLY", None))

filtered_args = []

for i, arg in enumerate(sys.argv):
    if arg == "--cmake":
        RERUN_CMAKE = True

        continue

    if arg == "--cmake-only":
        # o processo é interrompido assim que o cmake for
        # finalizado. isso permite que os usuários ajustem as
        # opções de compilação
        CMAKE_ONLY = True
        
        continue

    if arg == "rebuild" or arg == "build":
        arg = "build" # rebuild está acabado, fazer uma build

        EMIT_BUILD_WARNING = True

    if arg == "develop":
        print(
            (
                "aviso: redirecionando 'python setup.py develop' para 'pip install -e . -v --no-build-isolation',"
                " para mais informações veja: https://github.com/pytorch/pytorch/issues/152276"
            ),

            file=sys.stderr
        )

        result = subprocess.run(
            [
                sys.executable,
                "-m",
                "pip",
                "install",
                "-e",
                ".",
                "-v",
                "--no-build-isolation"
            ],

            env={**os.environ}
        )

        sys.exit(result.returncode)

    if arg == "install":
        print(
            (
                "aviso: redirecionando 'python setup.py install' para 'pip install . -v --no-build-isolation',"
                " para mais informações veja: https://github.com/pytorch/pytorch/issues/152276"
            ),

            file=sys.stderr
        )

        result = subprocess.run(
            [sys.executable, "-m", "pip", "install", ".", "-v", "--no-build-isolation"],
            env={**os.environ}
        )

        sys.exit(result.returncode)

    if arg == "--":
        filtered_args += sys.argv[i:]

        break

    if arg == "-q" or arg == "--quiet":
        VERBOSE_SCRIPT = False

    if arg in ["clean", "dist_info", "egg_info", "sdist"]:
        RUN_BUILD_DEPS = False

    filtered_args.append(arg)

sys.argv = filtered_args

if VERBOSE_SCRIPT:
    def report(
        *args: Any,
        file: IO[str] = sys.stderr,
        flush: bool = True,
        **kwargs: Any
    ) -> None:
        print(*args, file=file, flush=flush, **kwargs)
else:
    def report(
        *args: Any,
        file: IO[str] = sys.stderr,
        flush: bool = True,
        **kwargs: Any
    ) -> None:
        pass

    # faz o distutils respeitar a tag --quiet também
    setuptools.distutils.log.warn = report # type: ignore[attr-defined]

# variáveis constantes conhecidas utilizadas ao longo deste
# arquivo
TORCH_DIR = CWD / "torch"
TORCH_LIB_DIR = TORCH_DIR / "lib"
THIRD_PARTY_DIR = CWD / "third_party"

# cmake: path completo para a biblioteca python
if IS_WINDOWS:
    CMAKE_PYTHON_LIBRARY = (
        Path(sysconfig.get_config_var("prefix"))
        / "libs"
        / f"python{sysconfig.get_config_var('VERSION')}.lib"
    )

    # corrige as buildes de virtualenv
    if not CMAKE_PYTHON_LIBRARY.exists():
        CMAKE_PYTHON_LIBRARY = (
            Path(sys.base_prefix)
            / "libs"
            / f"python{sysconfig.get_config_var('VERSION')}.lib"
        )
else:
    CMAKE_PYTHON_LIBRARY = Path(
        sysconfig.get_config_var("LIBDIR")
    ) / sysconfig.get_config_var("INSTSONAME")


##############################################
# versão, create_version_file e package_name #
##############################################

TORCH_PACKAGE_NAME = os.getenv("TORCH_PACKAGE_NAME", "torch")
LIBTORCH_PKG_NAME = os.getenv("LIBTORCH_PACKAGE_NAME", "torch_no_python")

if BUILD_LIBTORCH_WHL:
    TORCH_PACKAGE_NAME = LIBTORCH_PKG_NAME

TORCH_VERSION = get_torch_version()

report(f"roda de construção {TORCH_PACKAGE_NAME}-{TORCH_VERSION}")

cmake = CMake()


def get_submodule_folders() -> list[Path]:
    git_modules_file = CWD / ".gitmodules"
    
    default_modules_path = [
        THIRD_PARTY_DIR / name

        for name in [
            "gloo",
            "cpuinfo",
            "onnx",
            "fbgemm",
            "cutlass"
        ]
    ]

    if not git_modules_file.exists():
        return default_modules_path
    
    with git_modules_file.open(encoding="utf-8") as f:
        return [
            CWD / line.partition("=")[-1].strip()
            
            for line in f

            if line.strip().startswith("path")
        ]
    

def check_submodules() -> None:
    def check_for_files(folder: Path, files: list[str]) -> None:
        if not any((folder / f).exists() for f in files):
            report("não foi possível encontrar nenhum de {} em {}".format(", ".join(files), folder))
            report("você rodou 'git submodule update --init --recursive'?")

            sys.exit(1)

    def not_exists_or_empty(folder: Path) -> bool:
        return not folder.exists() or (
            folder.is_dir() and next(folder.iterdir(), None) is None
        )
    
    if str2bool(os.getenv("USE_SYSTEM_LIBS")):
        return
    
    folders = get_submodule_folders()

    # se nenhuma das pastas de submódulos existir, tentar
    # inicializá-las
    if all(not_exists_or_empty(folder) for folder in folders):
        try:
            report(" --- tentando inicializar os submódulos")

            start = time.time()
            
            subprocess.check_call(
                ["git", "submodule", "update", "--init", "--recursive"], cwd=CWD
            )

            end = time.time()

            report(f" --- inicialização de submódulo levou {end - start:.2f} seg")
        except Exception:
            report(" --- inicialização de submódulo falhou")
            report("rode:\n\tgit submodule update --init --recursive")

            sys.exit(1)

    for folder in folders:
        check_for_files(
            folder,

            [
                "CMakeLists.txt",
                "Makefile",
                "setup.py",
                "LICENSE",
                "LICENSE.md",
                "LICENSE.txt"
            ]
        )

    check_for_files(
        THIRD_PARTY_DIR / "fbgemm" / "external" / "asmjit",

        ["CMakeLists.txt"]
    )


# o windows oferece um suporte muito ruim para links
# simbólicos. em vez de usar links simbólicos, copiar os
# arquivos
def mirror_files_into_torchgen() -> None:
    # (new_path, orig_path)

    # diretórios são ok e espelhados recursivamente
    paths = [
        (
            CWD / "torchgen/packaged/ATen/native/native_functions.yaml",
            CWD / "aten/src/ATen/native/native_functions.yaml"
        ), (
            CWD / "torchgen/packaged/ATen/native/tags.yaml",
            CWD / "aten/src/ATen/native/tags.yaml"
        ), (
            CWD / "torchgen/packaged/ATen/templates",
            CWD / "aten/src/ATen/templates"
        ), (
            CWD / "torchgen/packaged/autograd",
            CWD / "tools/autograd"
        ), (
            CWD / "torchgen/packaged/autograd/templates",
            CWD / "tools/autograd/templates"
        )
    ]

    for new_path, orig_path in paths:
        # cria os diretórios envolvidos em new_path caso
        # ainda não existam
        if not new_path.exists():
            new_path.parent.mkdir(parents=True, exist_ok=True)

        # copia os arquivos da localização original para a nova
        # localização
        if orig_path.is_file():
            shutil.copyfile(orig_path, new_path)

            continue

        if orig_path.is_dir():
            if new_path.exists():
                # copytree falha se a árvore já existir, então
                # remover ela
                shutil.rmtree(new_path)

            shutil.copytree(orig_path, new_path)

            continue

        raise RuntimeError("verifique os paths dos arquivos em `mirror_files_into_torchgen()`")