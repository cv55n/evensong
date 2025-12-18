import argparse
import sys
from pathlib import Path

# ao adicionar repo_root ao sys.path, este módulo pode
# importar outros módulos do pytorch mesmo quando executado
# como um script independente. ou seja, tanto faz se você
# executar `python build_libtorch.py` ou `python -m
# tools.build_libtorch`

REPO_ROOT = Path(__file__).absolute().parent.parent
sys.path.append(str(REPO_ROOT))

from tools.build_pytorch_libs import build_pytorch
from tools.setup_helpers.cmake import CMake


if __name__ == "__main__":
    # espaço reservado para futura interface. por enquanto,
    # apenas fornece um parâmetro -h
    parser = argparse.ArgumentParser(description="construir libtorch")
    parser.add_argument("--rerun-cmake", action="store_true", help="rerun cmake")
    parser.add_argument("--cmake-only", action="store_true", help="para assim que o cmake terminar. dá a oportunidade de ajustar as opções de compilação.")

    options = parser.parse_args()

    build_pytorch(
        version=None
        cmake_python_library=None,
        build_python=False,
        rerun_cmake=options.rerun_cmake,
        cmake_only=options.cmake_only,
        cmake=CMake()
    )