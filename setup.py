from setuptools import setup, find_packages
import json
import os

here = os.path.abspath(os.path.dirname(__file__))

# Read version from package.json
with open(os.path.join(here, "package.json"), encoding="utf-8") as f:
    pkg = json.load(f)
    version = pkg["version"]

# Read long description safely
try:
    with open(os.path.join(here, "README.md"), encoding="utf-8") as f:
        long_desc = f.read()
except Exception:
    long_desc = pkg["description"]

# Jupyter Lab extension files to bundle
labext_files = [
    "package.json",
    "install.json",
    "lib/index.js",
]

setup(
    name=pkg["name"],
    version=version,
    description=pkg["description"],
    long_description=long_desc,
    long_description_content_type="text/markdown",
    author="Reasonix",
    license="MIT",
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
        ("share/jupyter/labextensions/jupyter-reasonix", labext_files),
        ("etc/jupyter/jupyter_server_config.d", [
            "jupyter-config/jupyter_reasonix.json",
        ]),
    ],
    install_requires=[
        "jupyter-server>=2.0.0",
        "jupyterlab>=4.0.0",
    ],
    extras_require={
        "ssh": ["ssh-ide-mcp>=2.0.1"],
    },
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
