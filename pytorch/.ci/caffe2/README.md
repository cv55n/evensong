# jenkins

ss scripts neste diretório são o ponto de entrada para testar o caffe2.

a variável de ambiente `build_environment` deve ser definida com o ambiente de compilação que você pretende testar. ela serve como uma dica para os scripts de compilação e teste configurarem o caffe2 de uma determinada maneira e incluírem/excluírem testes. em imagens docker, o nome da imagem é o mesmo da própria imagem. por exemplo: `py2-cuda9.0-cudnn7-ubuntu16.04`. as imagens docker criadas no jenkins e usadas em compilações acionadas já possuem essa variável de ambiente definida em seu manifesto. consulte também o arquivo `./docker/jenkins/*/dockerfile` e procure por `build_environment`.
