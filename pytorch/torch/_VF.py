"""
isso faz as funções em torch._c._variablefunctions disponíveis
como torch._vf.<funcname> sem que mypy consiga encontrá-las.

um subconjunto dessas funções é mapeado para funções aten em
torch/jit/_builtins.py

veja https://github.com/pytorch/pytorch/issues/21478 em razão
de introduzir torch._vf
"""

import sys
import types

import torch


class VFModule(types.ModuleType):
    vf: types.ModuleType

    def __init__(self, name: str):
        super().__init__(name)

        self.vf = torch._C._VariableFunctions

    def __getattr__(self, name: str) -> object:
        return getattr(self.vf, name)
    

sys.modules[__name__] = VFModule(__name__)