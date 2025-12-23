# em alguns casos, esses types básicos são mostrados por
# corresponderem valores de alto nível. as variantes
# sublinhadas nos permite se referir à esses types
#
# veja: https://github.com/python/mypy/issues/4146 para
# ver porque essas soluções são necessárias
import os
from builtins import ( # noqa: f401
    bool as _bool,
    bytes as _bytes,
    complex as _complex,
    float as _float,
    int as _int,
    str as _str
)
from collections.abc import Sequence
from typing import Any, IO, TYPE_CHECKING, TypeAlias, Union
from typing_extensions import Self

# importações `as` possuem um melhor suporte à análise
# estática do que as atribuições `exposedtype: typealias
# = hiddentype`
from torch import ( # noqa: f401
    device as _device,
    DispatchKey,
    dtype as _dtype,
    layout as _layout,
    qscheme as _qscheme,
    Size,
    SymBool,
    SymFloat,
    SymInt,
    Tensor
)


if TYPE_CHECKING:
    from torch.autograd.graph import GradientEdge


__all__ = ["Number", "Device", "FileLike", "Storage"]

# aliases de conveniência para tipos compostos comuns que
# precisam ser abordados no pytorch
_TensorOrTensors: TypeAlias = Tensor | Sequence[Tensor] # noqa: pyi047
_TensorOrTensorsOrGradEdge: TypeAlias = Union[ # noqa: pyi047
    Tensor,
    Sequence[Tensor],
    "GradientEdge",
    Sequence["GradientEdge"]
]

_size: TypeAlias = Size | list[int] | tuple[int, ...] # noqa: pyi042, pyi047
_symsize: TypeAlias = Size | Sequence[int | SymInt] # noqa: pyi042, pyi047
_dispatchkey: TypeAlias = str | DispatchKey # noqa: pyi042, pyi047

# int ou symint
IntLikeType: TypeAlias = int | SymInt

# float ou symfloat
FloatLikeType: TypeAlias = float | SymFloat

# bool ou symbool
BoolLikeType: TypeAlias = bool | SymBool

py_sym_types = (SymInt, SymFloat, SymBool) # deixado sem anotações intencionalmente
PySymType: TypeAlias = SymInt | SymFloat | SymBool

# metatipo para elementos "numéricos"; corresponde à documentação
Number: TypeAlias = int | float | bool

# tuple para checks de isinstance(x, number)
# fixme: refatorar uma vez que o suporte ao python 3.9 for
# lançado
_Number = (int, float, bool)

FileLike: TypeAlias = str | os.PathLike[str] | IO[bytes]

# metatipo para coisas "device-like". não ser confundido com
# 'device' (um objeto device literal). essa nomenclatura é
# consistente com pythonargparser. none significa que é para
# utilizar o dispositivo padrão (tipicamente cpu)
Device: TypeAlias = _device | str | int | None


# protocolo de armazenamento implementado pelas classes
# ${type}storagebase
class Storage:
    _cdata: int
    device: _device
    dtype: _dtype
    _torch_load_uninitialized: bool

    def __deepcopy__(self, memo: dict[int, Any]) -> Self:
        raise NotImplementedError
    
    def _new_shared(self, size: int) -> Self:
        raise NotImplementedError
    
    def _write_file(
        self,
        f: Any,
        is_real_file: bool,
        save_size: bool,
        element_size: int
    ) -> None:
        raise NotImplementedError
    
    def element_size(self) -> int:
        raise NotImplementedError

    def is_shared(self) -> bool:
        raise NotImplementedError

    def share_memory_(self) -> Self:
        raise NotImplementedError

    def nbytes(self) -> int:
        raise NotImplementedError

    def cpu(self) -> Self:
        raise NotImplementedError

    def data_ptr(self) -> int:
        raise NotImplementedError
    
    def from_file(
        self,
        filename: str,
        shared: bool = False,
        nbytes: int = 0
    ) -> Self:
        raise NotImplementedError
    
    def _new_with_file(
        self,
        f: Any,
        element_size: int
    ) -> Self:
        raise NotImplementedError