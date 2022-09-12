from flask import Flask,request, render_template
from flask_cors import CORS
import json
import numpy as np
import pandas as pd
from sklearn.preprocessing import StandardScaler
from sklearn.decomposition import PCA
from flask import request
import ast
import networkx as nx

anova = pd.read_csv("./static/data/GeniPAAD.csv")
df_raw = pd.read_csv("./static/data/TmmCount.csv")
df_raw = df_raw.set_index('V1')
df = df_raw.T
features = df.columns.values

# Separating out the features
x = df.loc[:, features].values
# Standardizing the features
x = StandardScaler().fit_transform(x)
pca = PCA()
principalComponents = pca.fit_transform(x)
per_var = np.round(pca.explained_variance_ratio_*100,decimals = 1)
labels = ['PC' + str(x) for x in range(1,len(per_var)+1)]

#Save the first 2 PC
save_pc1_lable = per_var[0]
save_pc2_lable = per_var[1]
save_pc1_lable = "PC1("+ str(save_pc1_lable) +"%)"
save_pc2_lable = "PC2("+ str(save_pc2_lable) +"%)"

loading_scores = pd.Series(pca.components_[0],index = features)
sorted_loading_scores = loading_scores.abs().sort_values(ascending = False)
top_genes = sorted_loading_scores[0:1200].index.values

# PCA CSV
pca_df = pd.DataFrame(principalComponents,index=df.index,columns = labels)

ids = pca_df.PC1.index
x_axis = pca_df.PC1.values
y_axis = pca_df.PC2.values
a = []
hc = np.array(["HC"]).repeat(55)
paad = np.array(["PAAD"]).repeat(35)
classCond = [*hc,*paad]


for i in range(len(ids)):
    a.append( {'id':ids[i],'x':x_axis[i],'y':y_axis[i],'class':classCond[i]} )

pca_react = {'data' : a,'x':save_pc1_lable,'y':save_pc2_lable}

# Top genes
genes_react = {'data': list(loading_scores[top_genes].index)}

app = Flask(__name__)
CORS(app)

@app.route('/')
def home():
   return render_template('index.html')

   
@app.route("/genes")
def genes():
    return genes_react

@app.route("/pca")
def pca():
    return pca_react

def FisherTransform(x):
  return (1/2 * np.log((1+x)/(1-x)))

def zscores(x,y):
  v1 = 1/(34-3) 
  v2 = 1/(55-3) 
  zf = x - y 
  vf = v1 + v2 
  return (zf/np.sqrt(vf))

vecz = np.vectorize(zscores)     

def differential_co_expression_analysis(data):


    obj = ast.literal_eval(data) 
    geneIds = []
    for x in range(len(obj)):
        geneIds.append(obj[x]["GeneEnsembl"])
    
    df_HC = df_raw.iloc[:, :55]
    df_PAAD = df_raw.iloc[: , 56:]
    df_HC = df_HC[df_HC.index.isin(geneIds)]
    df_PAAD = df_PAAD[df_PAAD.index.isin(geneIds)]

    #cor matrices
    hc_cor = df_HC.T.corr(method = 'pearson')  # The method of correlation
    paad_cor = df_PAAD.T.corr(method = 'pearson')  # The method of correlation

    #zero diagonals
    np.fill_diagonal(hc_cor.values,0)
    np.fill_diagonal(paad_cor.values,0)

    #fisher matrices
    hc_cor_f = hc_cor.applymap(FisherTransform)
    paad_cor_f =paad_cor.applymap(FisherTransform)

    #Z - score
    z_df = pd.DataFrame(vecz(hc_cor_f, paad_cor_f))
    z_df.columns = hc_cor_f.columns
    z_df.index = hc_cor_f.index

    n_df = pd.DataFrame(vecz(hc_cor_f, paad_cor_f))
    n_df.columns = hc_cor_f.columns
    n_df.index = hc_cor_f.index

    #adjacency matrix
    threshold = 3
    z_df[abs(z_df)<threshold] = 0
    z_df[abs(z_df)>0] = 1

    n_df[abs(n_df)<threshold] = 0
    n_df[n_df>0] = 1
    n_df[n_df<0] = -1

    #degree
    degree = z_df.sum(axis = 1)

    #degree senza zeri
    degree_zero = degree.to_frame()
    degree_zero.columns = ['degree']
    degree_zero = degree_zero[degree_zero.degree != 0]
    if (degree_zero.empty):
        return 'empty'
    degree_zero = degree_zero.sort_values(by=['degree'], ascending=False)

    quantile = int(degree_zero.degree.quantile(0.9))
    final_list = []
    for i in range(len(degree_zero)):
        a = degree_zero["degree"][i] 
        geneIdentifier = anova.loc[anova['GeneEnsembl'] == degree_zero.index[i]]
        regulation = geneIdentifier.iloc[0]['regulation']
        if (a >= quantile) :
            final_list.append({'gene' : degree_zero.index[i],'y' : degree_zero['degree'][i],'regulation':regulation})

    #network
    network = n_df
    np.fill_diagonal(network.values,np.nan)
    G = nx.from_pandas_adjacency(network, create_using=nx.MultiDiGraph())
    G.edges(data=True)
    final_network =nx.to_pandas_edgelist(G)
    final_network = final_network[final_network['weight'].notna()]
    pd.set_option('display.max_rows', final_network.shape[0]+1)
    fstring = final_network.astype(str)
    final_list.append(str(fstring))
    return final_list 

@app.route('/postdce', methods=['GET', 'POST'])
def thisRoute():
    information = request.data
    information = information.decode("utf-8")
    if (information == '[]') :
        print('here')
        returni = 'empty'
        return returni

    returni = differential_co_expression_analysis(information)
    if returni == 'empty' : return "empty"
    else : return str(returni)
    

if __name__ == "__main__" :
    app.run(debug=True,host='127.0.0.1', port=5000)

