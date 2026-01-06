import sys


log_file_path = sys.argv[1]

with open(log_file_path) as f:
    lines = f.readlines()

for line in lines:
    # ignora erros do conjunto de instruções da cpu, testes de
    # símbolos existentes ou formatação de erros de compilção
    ignored_keywords = [
        "src.c",
        "CheckSymbolExists.c",
        "test_compilation_error_formatting"
    ]

    if all(keyword not in line for keyword in ignored_keywords):
        print(line)