# ---[ declara as variáveis ​​que usaremos em toda a compilação do caffe2.
# este arquivo define variáveis ​​comuns do caffe2 que usamos
# para coletar arquivos de origem e outras informações.
# cada variável é anotada com seus usos pretendidos
#
# observe que adicionar e/ou excluir essas variáveis 
# ​geralmente envolve a alteração de todo o sistema de
# compilação; portanto, certifique-se de enviar um pr com
# antecedência se desejar alterá-las

# caffe2_{cpu,gpu}_srcs é a lista que conterá todos os
# arquivos de origem relacionados à cpu e à gpu,
# respectivamente. eles serão preenchidos com os arquivos
cmakelists.txt em cada pasta correspondente
set(Caffe2_CPU_SRCS)
set(Caffe2_GPU_SRCS)

# caffe2_{cpu,gpu}_test_srcs é a lista que conterá todos os
# arquivos de origem relacionados aos testes de cpu e gpu,
# respectivamente
set(Caffe2_CPU_TEST_SRCS)
set(Caffe2_GPU_TEST_SRCS)

# caffe2_{cpu,gpu}_include é a lista que conterá todos os
# diretórios de inclusão para cpu e gpu, respectivamente
set(Caffe2_CPU_INCLUDE)
set(Caffe2_GPU_INCLUDE)

# listas das bibliotecas de dependência do caffe2, para cpu e
# cuda respectivamente
set(Caffe2_DEPENDENCY_LIBS "")
set(Caffe2_CUDA_DEPENDENCY_LIBS "")

# esta variável contém as bibliotecas de dependência do caffe2
# que requerem vinculação completa de símbolos. um exemplo é a
# biblioteca onnx, onde precisamos de todos os seus símbolos
# de schema. no entanto, se a biblioteca estiver totalmente
# vinculada à biblioteca do caffe2, não queremos que ela seja
# vinculada em binários que também vinculam a biblioteca do
# caffe2. isso porque, se a biblioteca do caffe2 for compilada
# como uma biblioteca dinâmica, haverá duas cópias dos
# símbolos de `caffe2_dependency_whole_link_libs` presentes no
# arquivo `caffe2.so` e no binário, o que causará problemas.
# portanto, `caffe2_dependency_whole_link_libs` será vinculada
# apenas pela biblioteca do caffe2
set(Caffe2_DEPENDENCY_WHOLE_LINK_LIBS "")

# listas de bibliotecas públicas que dependem do caffe2. essas
# bibliotecas serão transitivas para quaisquer bibliotecas que
# dependam do caffe2
set(Caffe2_PUBLIC_DEPENDENCY_LIBS "")
set(Caffe2_PUBLIC_CUDA_DEPENDENCY_LIBS "")

# lista de módulos que são compilados como parte da compilação
# principal do caffe2. todos os alvos binários, como binários
# python e nativos, serão vinculados automaticamente a esses
# módulos
set(Caffe2_MODULES "")