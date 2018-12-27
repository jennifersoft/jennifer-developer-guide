# JENNIFER Server Plugin

JENNIFER View Server plug-in is an extension that developers can implement in an independent development environment, which now provides a page and API type. A page type is a screen function such as the analysis screen or the statistic screen, and an API type is a feature that provides data in a particular format, such as the Open API. JENNIFER View Server Plugin mainly used for prototyping purposes prior to development with official features and has recently been in use to make the screen linkage with other monitoring solutions.

### Version Requirements

This document is based on Jennifer Server version 5.4.1.


## Configuring the plug-in development environment in IntelliJ

 1. Click `File > New > Project`.
 
 2. Select `Spring Initialzr`. Make sure to Set the `Project SDK` to (1.8) > Click Next.
 
 3. Enter the Project Metadata  > Make sure to set the Type to `(Maven Project)` > Click Next 
 
    3.1. `Group` value must be `com.aries`, the `Artifact` can be any value.

 4. On the Dependencies selection page, select `Spring Boot version(1.5.15)` > Add other dependencies as needed

## Maven pom.xml Setup

The following snippet is the dependency setup part for loading the required libraries, and for the remaining build-related details, see the [pom.xml](https://github.com/jennifersoft/jennifer-view-plugin-tutorial/blob/master/pom.xml) file that is distributed in this project.

```xml
<dependencies>
    <!-- TODO: Add required libraries here-->

    <!-- Libraries for implementing the Jennifer plugin. Do not remove  -->
    <dependency>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-starter-web</artifactId>
        <scope>provided</scope>
    </dependency>
    <dependency>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-devtools</artifactId>
        <scope>provided</scope>
        <optional>true</optional>
    </dependency>
    <dependency>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-starter-test</artifactId>
        <scope>test</scope>
    </dependency>
    <dependency>
        <groupId>com.aries</groupId>
        <artifactId>extension</artifactId>
        <version>1.2.1</version>
    </dependency>
</dependencies>
```

## Implementing the Plug-in

### Modifying the main class


To add the Spring interceptor provided by the JENNIFER extension library, you need to implement the `WebMvcConfigurer` interface in the main class as follows:

```java
package com.aries.tutorial

import com.aries.extension.starter.PluginStarter;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.web.servlet.config.annotation.InterceptorRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurerAdapter;

@SpringBootApplication
public class PluginTutorialApplication extends WebMvcConfigurerAdapter {
    @Override
    public void addInterceptors(InterceptorRegistry registry) {
        // Add PluginStarter class as spring primary interceptor
        registry.addInterceptor(new PluginStarter()).addPathPatterns("/plugin/**");
    }

    public static void main(String[] args) {
        SpringApplication.run(PluginTutorialApplication.class, args);
    }
}
```

### Modifying application.properties

JENNIFER server refers to [application.properties](https://github.com/jennifersoft/jennifer-view-plugin-tutorial/blob/master/src/main/resources/application.properties) file as metadata for plugin-in recognition, this file should be placed in `src/main/resources` directory.
> Note: The metadata file package.json, which was used when developing plugin-ins in version 5.3.x is no longer used. However, the NPM package configuration can be used during front-end development. 

```
aries.title = Plugin Tutorial
aries.description = JENNIFER Plug-in development tutorial page
aries.version = 5.4.1
aries.main.url = /plugin/tutorial
aries.main.tpl = templates/index.vm
aries.menu.type = labs
aries.directory.i18n = i18n
aries.directory.thumbnail = thumbnails
aries.output.js = runtime.js, vendors.js, app.js
aries.output.css = app.css
```

Below is the properties description. Note that if there is no main template, JENNIFER view server will recognize the plugin as an API type plugin.

| Property Name | Description | Required |
|:-------|-------|-------:|
| aries.title | Name of the plugin, shown in JENNIFER screen | X |
| aries.description | Description of the plugin, shown in JENNIFER screen | X |
| aries.version | Minimum version of the Jennifer Server to which the plugin will be loaded (5.4.0 or higher is required) | X |
| aries.main.url | Plugin Main URL (JENNIFER Server URL/mailUrl) | O |
| aries.menu.type | Plugin menu type. Value can be (labs, dashboard, realtime, analysis, statistics, management) | X |
| aries.main.tpl | Template file path mapped to the plugin main URL | X |
| aries.directory.i18n | Multilingual properties file (must be named message_ country code.properties) | X |
| aries.directory.thumbnail | Thumbnail image path shown in Jennifer's lab list (file name must be same as Jennifer theme name `classic` or `dark`)     | X |
| aries.output.js | List of script files injected into main template | X |
| aries.output.css | List of styles files injected into main template    | X |

### Project Directory Structure

The directory structure is as follows

| Directory Name | Description |
|:-------|-------|
| src/main/java/com/aries/* | Java code and/or subdirectories (packages). |
| src/main/resources/static | Directory to hold the resources (js,css,image) files |
| src/main/resources/templates | This is where the template (VM) files on the main screen are located. The template must follow the Velocity syntax. |
| src/main/resources/* | Directory to hold other files and resources are located. The subdirectory name can be freely set. You can add multilingual message files or thumbnail images. |

### Creating a plug-in Template

The template syntax follows the [Apache Velocity Engine](http://velocity.apache.org/engine/1.7/user-guide.html). You can pass values to the view through the Spring controller's Model object. In the template, you can refer to the following objects, the related functions are summarized as follows.

| Object Name| Description |
|:-------|-------|
| file | Used to references a resource file located in the `src/main/resources/static` directory. |
| i18n | Used to references i18n messages located in `src/main/resources/*` directory. |
| theme | A string value passed either `classic` or `dark`. Can be used to set the style depending on the selected theme. |
| language | The multilingual type string set by JENNIFER View server |

The following is sample code for the vm file set in aries.main.tpl in application.properties.

```xml
// Load resource file from the src/main/resources/static directory
<img src="$file.get("logo.png")"></img>

// Use an i18n message from the src/main/resources/* directory
<div>i18n : $i18n.get("M0001")</div>

// Print a paramter passed from the main controller (parameter names can be set arbitrarily)
<strong>parameter : $message</strong>
```

### Creating a Plugin-in Controller

To be registered as a Spring component, the controller class must be included in the `com.aries` package and must inherit from the `PluginController` class. The controller class can be implemented as shown below.

    
```java
package com.aries.tutorial;

import com.aries.extension.starter.PluginController;
import com.aries.extension.util.ConfigUtil;
import com.aries.extension.util.LogUtil;
import com.aries.extension.util.PropertyUtil;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestMethod;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseBody;
import org.springframework.web.servlet.ModelAndView;

@Controller
public class PluginTutorialController extends PluginController {

    @RequestMapping(value = { "/tutorial" }, method = RequestMethod.GET)
    @ResponseBody
    public ModelAndView getMainPage(Model model, @RequestParam(required=false, defaultValue="") String layout) {
        // Apply a different template according to the layout parameter.
        ModelAndView mav = new ModelAndView(layout.equals("iframe") ? "templates/iframe.vm" : "templates/main.vm");

        // Retrieve an option set in the  Adapter and Plugin screen
        String property = PropertyUtil.getValue("tutorial", "db_path", "../db_path_property");

        // Retrieve a view server option set in server_view.conf file
        String config = ConfigUtil.getValue("db_path", "../db_path_config");

        // Utility class used for loggin
        LogUtil.info(property + ", " + config);

        return mav;
    }
}
```

By default, the controller's view refers to `aries.main.tpl` set in `application.properties`. You can set the desired template according to the situation with the constructor variable of ModelAndView class.


### Using the plug-in JavaScript API

The JavaScript API makes it easy to query the Open API and shows X-View transaction analysis and active services list pop-ups. 

```javascript
import $ from 'jquery';
import extension from 'aries-extension-js';

$(function() {
    // TODO: Set Jennifer Server Address and the API token here.
    aries.extension.setup({
        hostName: "https://dev.jennifersoft.com",
        apiToken: "6tXrtSu5i8T"
    });

    $("#xview_popup").on("click", function(e) {
        // Directly shows X-View pop for the specified transactions (txIds)
        aries.extension.popup("xview", {
            domainId: 7908,
            txIds: [ "-6371365836736069843", "6541742202344215657", "-3416726780880622050" ],
            startTime: 1535462614471,
            endTime: 1535462614471
        });
    });

    $("#active_popup").on("click", function(e) {
        //Open Active Services Pop-up list
        aries.extension.popup("activeService", {
            domainId: 7908
        });
    });
    
    //Query the Open API example
    aries.extension.api("instance", {
        domain_id: 7908
    }, function(res) {
        console.log(res);
    });
});
```
#### Handling events when selecting a domain box

JENNIFER screens have a common component called a domain box. When selecting a domain, you can refer to the ID value of the selected domain through the following method.

```javascript
//Message from Jennifer (domain data) 
extension.on('domain', function(id) {
    extension.api('instance', { domain_id: id }, function(res){
        console.log('JENNIFER API', res);
    });
});

//Custom event generation 
extension.emit('domain', 7900);

```

### Building a plug-in client

Resources such as JavaScript code and images needed for client development should be placed in the `src/main/client` directory, and you should move the final bundled files to the `src/main/resources/static` directory before deploying the plugin project. The package.json file defines NPM commands that you can use when developing and deploying.

**Install the required dependencies**
```bash
npm install
```

**To lunch the client development server (see the webpack.conf.js file)**
```bash
npm start
```

**To command for creating final bundled files**
```bash
npm run dist
```



## Deploying a plug-in project

You can build and deploy in two forms as follow.

### JAR file to be loaded in JENNIFER view server Labs.

Once you have selected and installed the Jennifer profile of the MAVEN project, a  **PROJECT_NAME_jennifer-VERSION.jar** file will be created in the `dist` directory. The jar file can be added via the Jennifer 5 adapter and the Plugin Management screen.


### Stand-alone JAR file

If you choose to install the Maven project's local profile, the **PROJECT_NAME_local-VERSION.jar** file is created in the `dist` directory. The jar file can be run as follows:

~~~bash
COMMAND> java -jar PROJECT_NAME_local-VERSION.jar

You can pass the default theme and language through the JVM options
COMMAND> java -jar -Dtheme=dark,language=en PROJECT_NAME_local-VERSION.jar
~~~

## Possible Plug-in Usage

#### 1. Iframe Mode
You can set the layout of the page as follow **/plugin/tutorial?layout=iframe** . Currently, only Iframe type is provided. When the layout is an Iframe type, all areas except the body are removed. 

#### 2. User Defined Dashboard
A plug-in can be used as a component in the user-defined dashboard, adding the plug-in in the Iframe mode described earlier. 
![Image](./assets/img/plugin/iframe_1.png)
![Image](./assets/img/plugin/iframe_2.png)

#### 3. Share URL
Page-type plug-ins can only be accessed with login authentication. However, it is possible to access the plug-in page without having to go through login authentication through the shared URL.
![Image](./assets/img/plugin/share.png)

### 4. Add to JENNIFER Screen

The aries.menu.type option allows you to add plug-ins to dashboards, real-time, analytics, statistics, and administration screens in addition to the JENNIFER Labs. Note that when the menu type is dashboard and real-time, there is no scrolling on the screen, and it should be developed assuming that the content area size is 100% width/height.

![Image](./assets/img/plugin/dashboard.png "Dashboard/Real-Time")
    
![Image](./assets/img/plugin/analysis_statistics.png "Analysis/Statisitcs")
    
![Image](./assets/img/plugin/management.png "Management")

> Plug-in menu types have the following limitations, so please refer to them when developing.
> 1. Sharing URL functionality is disabled.
> 2. It only operates in Iframe mode.


## Used Libraries

### Server

In fact, more libraries are used on the Jennifer server, but the Maven builds remove all the overlapped libraries. So, check the [pom.xml](https://github.com/jennifersoft/jennifer-view-plugin-tutorial/blob/master/pom.xml)  file distributed by this project for more details.

> Jetty9, Spring4, Logback

### Client
When a plug-in runs on a Jennifer server, some functions, such as an administration screen, must be run, so a library with a global dependency is inevitably required.
> jquery.js, jui-ui.css, jui-grid.css