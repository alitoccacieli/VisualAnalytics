#Import section
from sklearn.preprocessing import StandardScaler
from sklearn.decomposition import PCA
from flask import Flask,request, render_template
from flask_cors import CORS
import networkx as nx
import pandas as pd
import numpy as np
import json
import ast


#Read Data (TmmCount contains the counts matrix, GeniPAAD contains the gene table with statistical results)
anova = pd.read_csv("./static/data/GeniPAAD.csv")
df_raw = pd.read_csv("./static/data/TmmCount.csv")
df_raw = df_raw.set_index('V1')
df = df_raw.T #Transpose the matrix
features = df.columns.values #get the values as features


x = df.loc[:, features].values # Separating out the features
x = StandardScaler().fit_transform(x) # Standardizing the features
pca = PCA() #Initialize Principal Component Analysis
principalComponents = pca.fit_transform(x) #fit
per_var = np.round(pca.explained_variance_ratio_*100,decimals = 1)
labels = ['PC' + str(x) for x in range(1,len(per_var)+1)] #label the Principal Components

#Save the first 2 PC (Principal Components)
save_pc1_lable = per_var[0]
save_pc2_lable = per_var[1]
save_pc1_lable = "PC1("+ str(save_pc1_lable) +"%)"
save_pc2_lable = "PC2("+ str(save_pc2_lable) +"%)"

loading_scores = pd.Series(pca.components_[0],index = features) #Get the scores
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

# pca data to be displayed as x and y points for scatterplot
pca_react = {'data' : a,'x':save_pc1_lable,'y':save_pc2_lable}

# Top genes to be displayed
genes_react = {'data': list(loading_scores[top_genes].index)}

#---------APP ROUTES----------#  
app = Flask(__name__)
CORS(app)

@app.route('/')
def home():
   return render_template('index.html')

   
@app.route("/genes") #return genes
def genes():
    return genes_react

@app.route("/pca") #return pca results
def pca():
    return pca_react
#----------------------------#  

# Function to compute Fisher z-Transformation that is used in the function --> differential_co_expression_analysis()
def FisherTransform(x):
  return (1/2 * np.log((1+x)/(1-x)))

# Function to compute zscores that is used in the function --> differential_co_expression_analysis()
def zscores(x,y): 
  v1 = 1/(34-3) 
  v2 = 1/(55-3) 
  zf = x - y 
  vf = v1 + v2 
  return (zf/np.sqrt(vf))

vecz = np.vectorize(zscores)     

#-----------------------------------------------------------------------#
# ANALYTIC FUNCTION : This function will compute the differential co-expression analysis between two conditions (healthy and cancer)
# The process that is needed to do so is described as follows:
#   1. Pass, as input, a matrix containing data for two conditions
#   2. Split the matrix into two matrices, of which the first will contain all genes with only samples from condition 1, and the second
#      will contain all genes with only samples from condition 2 (Please NOTE that both matrices keep the same features [genes]).
#   3. Compute the cor function (Correlation) to both matrices passing as method, the method 'pearson'.
#   4. Set to zero the diagonals (not needed) to both matrices.
#   5. Compute the Fisher z-Transformation to both matrices.
#   6. Compute the z-score matrix using as input the two matrices.
#   7. Decide for a threshold.
#   8. Compute the Adjacency matrix.
#   9. Use the adjacency matrix for :
#       9.1. Compute the degree for each feature (gene) to be then exported by the euser in the client side. 
#       9.2. Compute the network to be then exported by the user in the client side.

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

    #degree without zeros
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
    information = request.data #get data from the user interaction
    information = information.decode("utf-8") #decode data
    if (information == '[]') :
        print('here')
        returni = 'empty'
        return returni

    returni = differential_co_expression_analysis(information) #use data as input for the main function
    if returni == 'empty' : return "empty" #If empty data was passed let user know
    else : return str(returni) #return results to client side
    

if __name__ == "__main__" :
    app.run(debug=True,host='127.0.0.1', port=5000) #run app in local

