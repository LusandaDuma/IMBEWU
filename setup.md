# clone project
run: git clone https://github.com/Nkosi2000/imbewu.git

# update npm version
run: npm install -g npm@11.12.1

# install expo sdk 
run: npm install expo

# fix vulnerabilities
run: npm audit fix

# start app
run: npm expo start 

# *ALLOW* - Nodejs
# Press 'w' TO OPEN APP IN WEB BROWSER
# it will take a while but be patient and wait

#npx expo install react-native-webview react-native-youtube-iframe
#npm install react-native-webview@13.15.0 react-native-youtube-iframe@2.4.1 --save
#npm install react-native-web-webview@1.0.2 --save