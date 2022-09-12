# DCETool 

DCETool is a D3 based application for Differential Co-Expression Network Analysis Visualization and Computation. In this case the data used is RNA-seq data of Healthy Control and Pancreatic Adenocarcinoma patients from Tumor Educated Platelets samples.

## Usage

1) Download the code 
2) Extract zip (Should be named "VisualAnalysis-master")

MACOS Terminal :

1) ``cd VisualAnalytics-master`` Folder extracted above (Jump if already in it)
2) ``python3 -m venv venv`` Create Virtual Enviroment
3) ``source venv/bin/activate`` Activate Virtual Enviroment
4) ``pip install -r requirements.txt`` Install requirements for project (Flask,numpy,pandas,networkx,sklearn)
5) ``python3 server.py`` (Run server on 127.0.0.1:5000)

Then follow the ip suggested and use the tool !

WINDOWS Terminal :

1) ``cd VisualAnalytics-master``
2) ``python3 -m venv venv``
3) ``venv\Scripts\activate.bat``
4) ``pip install -r requirements.txt``
5) ``python3 server.py``
