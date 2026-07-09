from setuptools import setup, find_packages
import json
import os

here = os.path.abspath(os.path.dirname(__file__))

# Read version from package.json
with open(os.path.join(here, "package.json")) as f:
    pkg = json.load(f)
    version = pkg["version"]

# Ensure the jupyterlab extension metadata is attached
setup(
    name=pkg["name"],
    version=version,
    description=pkg["description"],
    long_description=open("README.md", encoding="utf-8").read(),
    long_description_content_type="text/markdown",
    author=pkg.get("author", "Reasonix"),
    license=pkg.get("license", "MIT"),
    url="https://github.com/orangepyt123456/jupyter-reasonix",
    packages=find_packages(),
    include_package_data=True,
    package_data={
        "jupyter_reasonix": [
            "static/*",
            "*.json",
        ],
    },
    data_files=[
        ("share/jupyter/labextensions/jupyter-reasonix", [
            "package.json",
            "install.json",
            "lib/index.js",
        ]),
        ("etc/jupyter/jupyter_server_config.d", [
            "jupyter-config/jupyter_reasonix.json",
        ]),
    ],
    install_requires=[
        "ssh-ide-mcp>=2.0.0",
        "jupyter-server>=2.0.0",
        "jupyterlab>=4.0.0",
    ],
    python_requires=">=3.9",
    entry_points={
        "jupyter_server_extension": [
            "jupyter_reasonix = jupyter_reasonix:load_jupyter_server_extension",
        ],
    },
    classifiers=[
        "Development Status :: 4 - Beta",
        "Framework :: Jupyter",
        "Framework :: Jupyter :: JupyterLab",
        "Framework :: Jupyter :: JupyterLab :: 4",
        "Programming Language :: Python :: 3",
        "Programming Language :: Python :: 3.9",
        "Programming Language :: Python :: 3.10",
        "Programming Language :: Python :: 3.11",
        "Programming Language :: Python :: 3.12",
        "Topic :: Scientific/Engineering :: Interface Engine/Protocol Translator",
    ],
    keywords="jupyter jupyterlab ssh reasonix chat remote",
)
