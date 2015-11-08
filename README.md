# emo

Experimental MOnitor framework

Features:

 - Control of experimental data acquisition supporting independent/joint operation of multiple systems
 - Configuration of data acquisition parameters through frontend (for authorized users)
 - Monitoring of errors and raising and tracking of issues with the system
 - Ability to view a filterable list of runs taken and display various aggregate information about the runs
 - View, save, and recall event displays using an integrated webapp. Automatically shows the newest event.
 - Frontend to an online monitoring tool. Ability to plot various diagnostics and place warnings on certain parameters (this must be done in conjuntion with a backend data processor, this program merely displays the info)
 - Logging, including automated messages from the system and messages placed by the user. Log messages are threaded and searchable either through built-in keyword/field search or direct DB query syntax.
 - Ability to force operators to check certain quantities (i.e. noise spectra) that are generated periodically/on system reset.
 - User control and access levels. LDAP authentication.
 

This project is developed by Daniel Coderre at the University of Bern
The code is probably specific to our application but if you are interested in contributing or adapting parts of the code for your purposes please contact the dev(s).

Install Ubuntu 14.04

  - Get anaconda with: ``` wget https://3230d63b5fc54e62148e-c95ac804525aac4b6dba79b00b39d1d3.ssl.cf1.rackcdn.com/Anaconda3-2.3.0-Linux-x86_64.sh```
  - ```bash Anaconda3-2.3.0-Linux-x86_64.sh```
  - Follow on-screen instructions, agree to annoying license.
  - Either log out and back in or use executable in conda/bin directory to: ```conda create -n web python=3.4```
  - Activate the environment: ```source activate web```
  - Checkout the code: ```git clone https://{user}@github.com/coderdj/emo emo```
  - Install hdf5 ```sudo apt-get install libhdf5-dev snappy libldap2-dev libsasl2-dev```
  - Numba's installation is annoying (it's the whole reason we needed anaconda). Install it using ```conda install numba```. Cross your fingers. 
  - Do the same for scipy: ```conda install scipy```
  - Install remaining requirements: ```cd emo && pip install -r requirements.txt```
  - Create a certificate file /usr/local/share/ca-certificates/lngs.crt and paste the certificate there.
  - Run ```sudo update-ca-certificates```
  
You should now be able to run:
  ```
  python manage.py migrate
  python runserver
  ```
  
 Instructions for deployment coming soon.
