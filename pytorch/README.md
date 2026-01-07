![logo do pytorch](https://github.com/pytorch/pytorch/raw/main/docs/source/_static/img/pytorch-logo-dark.png)

--------------------------------------------------------------------------------

pytorch é um pacote python que oferece dois recursos principais:
- computação de tensores (como numpy) com forte aceleração por gpu
- redes neurais profundas construídas em um sistema de autogradação baseado em fita

você pode reutilizar seus pacotes python favoritos, como numpy, scipy e cython, para estender o pytorch quando necessário

nossos sinais de saúde do tronco (integração contínua) podem ser encontrados em [hud.pytorch.org](https://hud.pytorch.org/ci/pytorch/pytorch/main)

<!-- toc -->

- [mais sobre o pytorch](#more-about-pytorch)
    - [uma biblioteca de tensores pronta para gpu](#a-gpu-ready-tensor-library)
    - [redes neurais dinâmicas: autogradação baseada em fita](#dynamic-neural-networks-tape-based-autograd)
    - [python primeiro](#python-first)
    - [experiências imperativas](#imperative-experiences)
    - [rápido e enxuto](#fast-and-lean)
    - [extensões sem dor](#extensions-without-pain)
- [instalação](#installation)
    - [binários](#binaries)
        - [plataformas nvidia jetson](#nvidia-jetson-platforms)
    - [da fonte](#from-source)
        - [pré-requisitos](#prerequisites)
            - [suporte à nvidia cuda](#nvidia-cuda-support)
            - [suporte à amd rocm](#amd-rocm-support)
            - [suporte à intel gpu](#intel-gpu-support)
        - [obtenha a fonte do pytorch](#get-the-pytorch-source)
        - [instale as dependências](#install-dependencies)
        - [instale o pytorch](#install-pytorch)
            - [ajuste das opções de build (opcional)](#adjust-build-options-optional)
    - [imagem docker](#docker-image)
        - [utilizando imagens pré-construídas](#using-pre-built-images)
        - [construindo a imagem por si só](#building-the-image-yourself)
    - [construindo a documentação](#building-the-documentation)
        - [construindo um pdf](#building-a-pdf)
    - [versões anteriores](#previous-versions)
- [introdução](#getting-started)
- [recursos](#resources)
- [comunicação](#communication)
- [lançamentos e contribuições](#releases-and-contributing)
- [o time](#the-team)
- [licença](#license)

<!-- tocstop -->

## mais sobre o pytorch

[aprenda o básico do pytorch](https://pytorch.org/tutorials/beginner/basics/intro.html)

em um nível granular, o pytorch é uma biblioteca que consiste nos seguintes componentes:

| componente | descrição |
| --- | --- |
| [**torch**](https://pytorch.org/docs/stable/torch.html) | uma biblioteca de tensores como o numpy, com forte suporte a gpu |
| [**torch.autograd**](https://pytorch.org/docs/stable/autograd.html) | uma biblioteca de diferenciação automática baseada em fita que suporta todas as operações de tensores diferenciáveis em pytorch |
| [**torch.jit**](https://pytorch.org/docs/stable/jit.html) | uma pilha de compilação (torchscript) para criar modelos serializáveis e otimizáveis a partir do código pytorch |
| [**torch.nn**](https://pytorch.org/docs/stable/nn.html) | uma biblioteca de redes neurais profundamente integrada ao autograd, projetada para máxima flexibilidade |
| [**torch.multiprocessing**](https://pytorch.org/docs/stable/multiprocessing.html) | multiprocessamento em python, mas com o compartilhamento mágico de memória de tensores pytorch entre processos. útil para carregamento de dados e treinamento com hogwild |
| [**torch.utils**](https://pytorch.org/docs/stable/data.html) | dataloader e outras funções utilitárias para sua conveniência |

geralmente, o pytorch é usado como:

- uma alternativa ao numpy para aproveitar o poder das gpus
- uma plataforma de pesquisa em aprendizado profundo que oferece máxima flexibilidade e velocidade

para detalhar melhor:

### uma biblioteca de tensores pronta para gpu

se você usa numpy, então você já usou tensores (também conhecidos como ndarrays)

![ilustração de tensor](https://github.com/pytorch/pytorch/raw/main/docs/source/_static/img/tensor_illustration.png)

o pytorch fornece tensores que podem residir tanto na cpu quanto na gpu e acelera a computação de forma significativa

oferecemos uma ampla variedade de rotinas de tensores para acelerar e atender às suas necessidades de computação científica, como fatiamento, indexação, operações matemáticas, álgebra linear e reduções. e elas são rápidas

### redes neurais dinâmicas: autogradação baseada em fita

o pytorch possui uma maneira única de construir redes neurais: usando e reproduzindo um gravador de fita

a maioria dos frameworks, como tensorflow, theano, caffe e cntk, tem uma visão estática do mundo
é preciso construir uma rede neural e reutilizar a mesma estrutura repetidamente
alterar o comportamento da rede significa começar do zero

com o pytorch, usamos uma técnica chamada diferenciação automática em modo reverso, que permite alterar o comportamento da sua rede arbitrariamente, sem atraso ou sobrecarga. nossa inspiração vem de diversos artigos de pesquisa sobre o tema, bem como de trabalhos atuais e anteriores, como

[torch-autograd](https://github.com/twitter/torch-autograd)
[autograd](https://github.com/hips/autograd)
[chainer](https://chainer.org), etc

embora essa técnica não seja exclusiva do pytorch, é uma das implementações mais rápidas até o momento. você obtém o melhor em velocidade e flexibilidade para suas pesquisas ousadas

![gráfico dinâmico](https://github.com/pytorch/pytorch/raw/main/docs/source/_static/img/dynamic_graph.gif)