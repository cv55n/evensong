#!/usr/bin/env bash
#
# script utilizado apenas na pipeline de cd

set -exou pipefail

image="$1"
shift

if [ -z "${image}" ]; then
    echo "uso: $0 IMAGENAME:ARCHTAG"

    exit 1
fi

# vai de imagename:tag para tag
DOCKER_TAG_PREFIX=$(echo "${image}" | awk -F':' '{print $2}')

CUDA_VERSION=""
ROCM_VERSION=""
EXTRA_BUILD_ARGS=""

if [[ "${DOCKER_TAG_PREFIX}" == cuda* ]]; then
    # extrai a versão do cuda a partir do nome da imagem e tag
    # ex: manylinux2_28-builder:cuda12.8 retorna 12.8

    CUDA_VERSION=$(echo "${DOCKER_TAG_PREFIX}" | awk -F'cuda' '{print $2}')
    EXTRA_BUILD_ARGS="--build-arg CUDA_VERSION=${CUDA_VERSION}"
elif [[ "${DOCKER_TAG_PREFIX}" == rocm* ]]; then
    # extrai a versão do rocm a partir do nome da imagem e tag
    # ex: manylinux2_28-builder:rocm6.2.4 retorna 2.6.4

    ROCM_VERSION=$(echo "${DOCKER_TAG_PREFIX}" | awk -F'rocm' '{print $2}')
    EXTRA_BUILD_ARGS="--build-arg ROCM_IMAGE=rocm/dev-almalinux-8:${ROCM_VERSION}-complete"
fi

case ${DOCKER_TAG_PREFIX} in
    cpu)
        BASE_TARGET=base
        ;;
    cuda*)
        BASE_TARGET=cuda${CUDA_VERSION}
        ;;
    rocm*)
        BASE_TARGET=rocm
        PYTORCH_ROCM_ARCH="gfx900;gfx906;gfx908;gfx90a;gfx942;gfx1030;gfx1100;gfx1101;gfx1102;gfx1200;gfx1201;gfx950;gfx1150;gfx1151"
        EXTRA_BUILD_ARGS="${EXTRA_BUILD_ARGS} --build-arg PYTORCH_ROCM_ARCH=${PYTORCH_ROCM_ARCH}"
        ;;
    *)
        echo "erro: tag ${DOCKER_TAG_PREFIX} do docker desconhecida"

        exit 1
        
        ;;
esac

# todo: remover o patch limitnofile=1048576 assim que o
# problema https://github.com/pytorch/test-infra/issues/5712
# for resolvido. este patch é necessário para corrigir o
# problema de tempo limite na compilação do docker no amazon
# linux 2023
sudo sed -i s/LimitNOFILE=infinity/LimitNOFILE=1048576/ /usr/lib/systemd/system/docker.service
sudo systemctl daemon-reload
sudo systemctl restart docker

export DOCKER_BUILDKIT=1
TOPDIR=$(git rev-parse --show-toplevel)
tmp_tag=$(basename "$(mktemp -u)" | tr '[:upper:]' '[:lower:]')

docker build \
    --target final \
    --progress plain \
    --build-arg "BASE_TARGET=${BASE_TARGET}" \
    --build-arg "DEVTOOLSET_VERSION=13" \
    ${EXTRA_BUILD_ARGS} \
    -t ${tmp_tag} \
    $@ \
    -f "${TOPDIR}/.ci/docker/almalinux/Dockerfile" \
    ${TOPDIR}/.ci/docker/

if [ -n "${CUDA_VERSION}" ]; then
    # testa se está sendo utilizado o compilador cuda correto
    docker run --rm "${tmp_tag}" nvcc --version | grep "cuda_${CUDA_VERSION}"
fi