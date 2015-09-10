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
