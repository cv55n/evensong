import torch

from torch.types import Device as _device_t


def _get_device_index(device: _device_t, optional: bool = False) -> int:
    if isinstance(device, int):
        return device
    
    if isinstance(device, str):
        device = torch.device(device)

    device_index: int | None = None

    if isinstance(device, torch.device):
        acc = torch.accelerator.current_accelerator()

        if acc is None:
            raise RuntimeError("esperava-se um acelerador")
        
        if acc.type != device.type:
            raise ValueError(
                f"{device.type} não bate com o acelerador atual {acc}."
            )
        
        device_index = device.index

    if device_index is None:
        if not optional:
            raise ValueError(
                f"esperava-se um torch.device com um index específico ou um integer, porém foi obtido: {device}"
            )
        
        return torch.accelerator.current_device_index()
    
    return device_index