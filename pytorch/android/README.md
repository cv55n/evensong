# android

## demo de aplicativos e tutoriais

refira-se a [meta-pytorch/executorch-examples](https://github.com/meta-pytorch/executorch-examples/tree/main/dl3/android/DeepLabV3Demo) para o app demo do android baseado em [executorch](https://github.com/pytorch/executorch).

entre no servidor do [discord](https://discord.com/channels/1334270993966825602/1349854760299270284) para qualquer questão.

## publicação

##### release

os artefatos de lançamento são publicados no jcenter:

```groovy
repositories {
    jcenter()
}

# construção do interpretador lite
dependencies {
    implementation 'org.pytorch:pytorch_android_lite:1.10.0'
    implementation 'org.pytorch:pytorch_android_torchvision_lite:1.10.0'
}

# construção do jit completo
dependencies {
    implementation 'org.pytorch:pytorch_android:1.10.0'
    implementation 'org.pytorch:pytorch_android_torchvision:1.10.0'
}
```
