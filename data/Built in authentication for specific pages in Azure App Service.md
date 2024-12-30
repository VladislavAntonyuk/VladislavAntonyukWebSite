Hello!

In this article, I would like to describe how to add authentication and authorization for specific pages without redeploying your web app using Azure App Service.

Azure App Service provides built-in authentication and authorization capabilities, so you can sign in users and access data by writing minimal or no code in your web app.

Azure is like an iceberg, where the Portal is only 10% of the whole power.

By default Azure App Service built-in authentication redirects all pages to the Identity provider page, but we want to set it up only for a specific page, like "/admin". I haven't found how to implement it in the portal. Let me know in the comments if you find a solution.

To achieve the result we will use another Microsoft service, but let's go step by step:

1. Go to App Service, select Authentication, and click "Add identity provider".
![Add new provider](https://ik.imagekit.io/VladislavAntonyuk/vladislavantonyuk/articles/18/14-1.png)
1. Choose the identity provider you like
![Available identity provider](https://ik.imagekit.io/VladislavAntonyuk/vladislavantonyuk/articles/18/14-2.png)
1. Fill out the App registration settings and click Add. A new provider should be added.
![New provider](https://ik.imagekit.io/VladislavAntonyuk/vladislavantonyuk/articles/18/14-3.png)

To check if everything works fine so far, you can navigate to any page. You should be redirected to the identity provider.

Now let's set it for specific pages only. To do that, navigate to the [Azure Resource Explorer](https://resources.azure.com/){target="_blank"}.

In the treeview select `subscriptions->your subscription->resourceGroups->your resource group->providers->Microsoft.Web->sites->you site->config->authsettingsV2`.

This file contains all settings related to authentication. You can set session duration, identity provider configurations, etc.

We are interested in `globalValidation` section. Find this section and add the new property `excludedPaths`. It's an array of strings with paths that should be excluded from the global rule. **`excludedPaths` is a list of "allowed" paths - the paths, which don't require authentication.**
![GlobalValidation settings](https://ik.imagekit.io/VladislavAntonyuk/vladislavantonyuk/articles/18/14-4.png)

Your `globalValidation` section may look like this:
```json
"globalValidation": {
      "requireAuthentication": true,
      "unauthenticatedClientAction": "RedirectToLoginPage",
      "redirectToProvider": "google",
      "excludedPaths": [
        "/index.html",
        "/js/*",
        "/css/*",
      ]
    },
```
which means redirect to Google login page for all requests except "/index.html", "/js/" - any path in js folder, "/css/*" - any path in js folder.

Now if you open "/admin" page, you will be redirected to the Google login page, but if you open "index.html", you will see its content.

You can read more about GlobalValidation on Microsoft Docs: [GlobalValidation Class](https://docs.microsoft.com/en-us/dotnet/api/microsoft.azure.management.websites.models.globalvalidation?view=azure-dotnet){target="_blank"}.

Happy coding!
