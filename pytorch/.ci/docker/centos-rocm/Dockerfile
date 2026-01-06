ARG CENTOS_VERSION

FROM centos:${CENTOS_VERSION}

ARG CENTOS_VERSION

# define as gpus amd que serão alvos de compilação
ARG PYTORCH_ROCM_ARCH
ENV PYTORCH_ROCM_ARCH ${PYTORCH_ROCM_ARCH}

# instala os pacotes necessários para compilar o caffe2

# instala as dependências comuns (para que esta etapa possa
# ser armazenada em cache separadamente)
COPY ./common/install_base.sh install_base.sh
RUN bash ./install_base.sh && rm install_base.sh

# atualiza a versão do git do centos
RUN yum -y remove git
RUN yum -y remove git-*
RUN yum -y install https://packages.endpointdev.com/rhel/7/os/x86_64/endpoint-repo-1.9-1.x86_64.rpm && \
    sed -i 's/packages.endpoint/packages.endpointdev/' /etc/yum.repos.d/endpoint.repo
RUN yum install -y git

# instala o devtoolset
ARG DEVTOOLSET_VERSION
COPY ./common/install_devtoolset.sh install_devtoolset.sh
RUN bash ./install_devtoolset.sh && rm install_devtoolset.sh
ENV BASH_ENV "/etc/profile"

# (opcional) instala a versão não padrão do glibc
ARG GLIBC_VERSION
COPY ./common/install_glibc.sh install_glibc.sh
RUN if [ -n "${GLIBC_VERSION}" ]; then bash ./install_glibc.sh; fi
RUN rm install_glibc.sh

# instala o usuário
COPY ./common/install_user.sh install_user.sh
RUN bash ./install_user.sh && rm install_user.sh

# instala a conda e outros pacotes (por exemplo, numpy, pytest)
ARG ANACONDA_PYTHON_VERSION
ARG BUILD_ENVIRONMENT
ENV ANACONDA_PYTHON_VERSION=$ANACONDA_PYTHON_VERSION
ENV PATH /opt/conda/envs/py_$ANACONDA_PYTHON_VERSION/bin:/opt/conda/bin:$PATH
COPY requirements-ci.txt /opt/conda/requirements-ci.txt
COPY ./common/install_conda.sh install_conda.sh
COPY ./common/common_utils.sh common_utils.sh
RUN bash ./install_conda.sh && rm install_conda.sh common_utils.sh /opt/conda/requirements-ci.txt

# (opcional) instala pacotes de visão computacional como o opencv
ARG VISION
COPY ./common/install_vision.sh ./common/cache_vision_models.sh ./common/common_utils.sh ./
RUN if [ -n "${VISION}" ]; then bash ./install_vision.sh; fi
RUN rm install_vision.sh cache_vision_models.sh common_utils.sh
ENV INSTALLED_VISION ${VISION}

# instala o rocm
ARG ROCM_VERSION
RUN mkdir ci_commit_pins
COPY ./common/common_utils.sh common_utils.sh
COPY ./ci_commit_pins/rocm-composable-kernel.txt ci_commit_pins/rocm-composable-kernel.txt
COPY ./common/install_rocm.sh install_rocm.sh
RUN bash ./install_rocm.sh
RUN rm install_rocm.sh common_utils.sh
RUN rm -r ci_commit_pins
COPY ./common/install_rocm_magma.sh install_rocm_magma.sh
RUN bash ./install_rocm_magma.sh ${ROCM_VERSION}
RUN rm install_rocm_magma.sh
COPY ./common/install_amdsmi.sh install_amdsmi.sh
RUN bash ./install_amdsmi.sh
RUN rm install_amdsmi.sh
ENV PATH /opt/rocm/bin:$PATH
ENV PATH /opt/rocm/hcc/bin:$PATH
ENV PATH /opt/rocm/hip/bin:$PATH
ENV PATH /opt/rocm/opencl/bin:$PATH
ENV PATH /opt/rocm/llvm/bin:$PATH
ENV MAGMA_HOME /opt/rocm/magma
ENV LANG en_US.utf8
ENV LC_ALL en_US.utf8

# (opcional) instala a versão não padrão do ninja
ARG NINJA_VERSION
COPY ./common/install_ninja.sh install_ninja.sh
RUN if [ -n "${NINJA_VERSION}" ]; then bash ./install_ninja.sh; fi
RUN rm install_ninja.sh

ARG TRITON
# instala o triton. isso precisa ser feito antes do sccache,
# pois este último tentará acessar o s3, ao qual os executores
# de build do docker não têm acesso
ENV CMAKE_C_COMPILER cc
ENV CMAKE_CXX_COMPILER c++
COPY ./common/install_triton.sh install_triton.sh
COPY ./common/common_utils.sh common_utils.sh
COPY ci_commit_pins/triton.txt triton.txt
COPY triton_version.txt triton_version.txt
RUN if [ -n "${TRITON}" ]; then bash ./install_triton.sh; fi
RUN rm install_triton.sh common_utils.sh triton.txt triton_version.txt

# instala o ccache/sccache (faz isso por último, para que
# se tenha prioridade no path)
COPY ./common/install_cache.sh install_cache.sh
ENV PATH /opt/cache/bin:$PATH
RUN bash ./install_cache.sh && rm install_cache.sh

# inclui a variável de ambiente build_environment na imagem
ARG BUILD_ENVIRONMENT
ENV BUILD_ENVIRONMENT ${BUILD_ENVIRONMENT}

USER jenkins
CMD ["bash"]