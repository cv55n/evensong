set -ex

LOCAL_DIR=$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)
ROOT_DIR=$(cd "$LOCAL_DIR"/../.. && pwd)
TEST_DIR="$ROOT_DIR/test"

gtest_reports_dir="${TEST_DIR}/test-reports/cpp"
pytest_reports_dir="${TEST_DIR}/test-reports/python"

# descobre qual versão do python usar
PYTHON="$(which python)"

if [[ "${BUILD_ENVIRONMENT}" =~ py((2|3)\.?[0-9]?\.?[0-9]?) ]]; then
    PYTHON=$(which "python${BASH_REMATCH[1]}")
fi

if [[ "${BUILD_ENVIRONMENT}" == *rocm* ]]; then
    # hip_platform é auto-detectado pelo hipcc; desmarcar para evitar erros de build
    unset HIP_PLATFORM

    if which sccache > /dev/null; then
        # salva logs do sccache para o arquivo
        sccache --stop-server || true
        rm -f ~/sccache_error.log || true
        SCCACHE_ERROR_LOG=~/sccache_error.log SCCACHE_IDLE_TIMEOUT=0 sccache --start-server

        # reporta estatísticas do sccache para um debugging mais fácil
        sccache --zero-stats
    fi
fi

# /usr/local/caffe2 é onde os bits do cpp estão instalados nas
# builds do cmake-only. nas builds +python os testes do cpp
# são copiados para /usr/local/caffe2 então o código de teste
# em .ci/test é o mesmo
INSTALL_PREFIX="/usr/local/caffe2"

mkdir -p "$gtest_reports_dir" || true
mkdir -p "$pytest_reports_dir" || true
mkdir -p "$INSTALL_PREFIX" || true