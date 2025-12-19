import torch


def show() -> str:
    """
    retorna uma string legível por humanos com descrições da
    configuração do pytorch
    """

    return torch._C._show_config()


# todo: a princípio, poderia-se fornecer informações da
# versão/configuração mais estruturadas aqui. por enquanto,
# apenas cxx_flags está exposto, pois o timer os utiliza
def _cxx_flags() -> str:
    """
    retorna as cxx_flags usadas ao compilar o pytorch
    """

    return torch._C._cxx_flags()


def parallel_info() -> str:
    r"""retorna uma string detalhada com as configurações de paralelização"""

    return torch._C._parallel_info()