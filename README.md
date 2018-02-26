# TestLoginApp
 
## Features

```
    
 1.) User visits the URL and logs in with her Google Account.
 2.) The application stores the emails from last 30 days into a database (preferably postgres).
 3.) The home page renders. It will only have a search box where you can search for one single term. (ex. food, shooting, social)
 4.) Once the searh button is hit, the first 10 results from the email body will be shown in the search page.
 5.) When 1 of the 10 displayed search result is clicked - it opens a details page which lists all the messages in that email thread.
 6.) There I should have an option to send an sms to my number with the subject of the email. You can use twilio or plivo for SMS integration.
 7.) There should be a "back" button in your details page to take you back to the "search results" page that you came from
 
```

## Prerequisites

Git

NodeJs

NPM

MongoDB

## Running

  running mongodb:
```
    1). Open Command Prompt and change directory to where mongodb is installed in bin folder.
    2). then type mongod in command prompt 
    3). press enter database server will start.
```
  unzipping and installing dependencies:
```
    1). Unzip the downloaded file.
    2). Open the extracted folder.
    3). Type Command : npm install and press enter. This will install all dependencies shown in package.json file.
    4). If terminal says can't find module then install other dependencies using npm install 'dependency name' command
    note:dependency name is the name of dependency prompt by terminal
```
  running project:
```
    Install all dependencies by : npm install, Then go to server folder and run node app.js


```
## Built With

OS : Windows 10

API Tool : Postman

Editor : VS Code

Frontend Technologies allowed - HTML 5, CSS, Javascript , Jquery and AngularJS

Backend Technologies allowed - NodeJs, ExpressJS, MongoDB


### License
The MIT License (MIT)

