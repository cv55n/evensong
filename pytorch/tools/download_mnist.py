import argparse
import gzip
import os
import sys

from urllib.error import URLError
from urllib.request import urlretrieve


MIRRORS = [
    "https://ossci-datasets.s3.amazonaws.com/mnist/" # @lint-ignore
]

RESOURCES = [
    "train-images-idx3-ubyte.gz",
    "train-labels-idx1-ubyte.gz",
    "t10k-images-idx3-ubyte.gz",
    "t10k-labels-idx1-ubyte.gz"
]


def report_download_progress(
    chunk_number: int,
    chunk_size: int,
    file_size: int
) -> None:
    if file_size != -1:
        # pyrefly: ignore [no-matching-overload]
        percent = min(1, (chunk_number * chunk_size) / file_size)
        bar = "#" * int(64 * percent)
        sys.stdout.write(f"\r0% |{bar:<64}| {int(percent * 100)}%")


def download(destination_path: str, resource: str, quiet: bool) -> None:
    if os.path.exists(destination_path):
        if not quiet:
            print(f"{destination_path} já existe, pulando...")
    else:
        for mirror in MIRRORS:
            url = mirror + resource

            print(f"baixando {url}...")

            try:
                hook = None if quiet else report_download_progress

                urlretrieve(url, destination_path, reporthook=hook)
            except (URLError, ConnectionError) as e:
                print(f"falha ao baixar (tentando o próximo):\n{e}")

                continue
            finally:
                if not quiet:
                    # apenas uma nova linha

                    print()
            break
        else:
            raise RuntimeError("erro ao baixar o recurso!")
        

def unzip(zipped_path: str, quiet: bool) -> None:
    unzipped_path = os.path.splitext(zipped_path)[0]

    if os.path.exists(unzipped_path):
        if not quiet:
            print(f"{unzipped_path} já existe, pulando...")

        return
    with gzip.open(zipped_path, "rb") as zipped_file:
        with open(unzipped_path, "wb") as unzipped_file:
            unzipped_file.write(zipped_file.read())

            if not quiet:
                print(f"{zipped_path} unzippado...")

            
def main() -> None:
    parser = argparse.ArgumentParser(description="baixa o dataset mnist da internet")

    parser.add_argument("-d", "--destination", default=".", help="diretório do destino")
    parser.add_argument("-q", "--quiet", action="store_true", help="não reporta sobre o progresso")

    options = parser.parse_args()

    if not os.path.exists(options.destination):
        os.makedirs(options.destination)

    try:
        for resource in RESOURCES:
            path = os.path.join(options.destination, resource)

            download(path, resource, options.quiet)
            unzip(path, options.quiet)
    except KeyboardInterrupt:
        print("interrompido")


if __name__ == "__main__":
    main()