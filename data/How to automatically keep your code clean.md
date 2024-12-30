This is my first article, which I dedicate to setting tools that can help to keep the code clean and prevent you from publishing unexpected files to the repository.

First, let me ask you 2 questions, which will help you to better understand the reason for writing the article.

1. How many times did you publish a confidential file to the repository, so you needed to revert your changes?
2. How many people are working with you on the same code?

As for the first question, we all know that people make mistakes, but we can prevent ourselves from them.

As for the second question, if you work in a team, you probably see your team member write code in a slightly different style than you normally do (extra spaces, additional scopes, or brackets). As for me, I prefer a consistent code style with predefined rules, which each team member follows. But even if you defined some config files, it doesn't matter that all will follow them. So we need additional steps which will check all our configurations before publishing the code.

So, let's start.

//Note: some steps are applied for a git repository only.//

**Step 1.**

First, let's create a new empty library project `GitConfiguration`.

Now open csproj file and replace its content with:

```xml
<Project Sdk="Microsoft.NET.Sdk">

	<PropertyGroup>
		<TargetFramework>netstandard2.0</TargetFramework>
	</PropertyGroup>

	<Target Name="PreBuild" BeforeTargets="PreBuildEvent">
	  <Exec Command="git config core.hookPath hooks" />
	</Target>
</Project>
```
Create a new folder `hooks` in your repository root folder. 
Build your solution. Now git is configured to our `hooks` folder.

Here we use the command `git config core.hookPath hooks` which set up git to use actions from the specific folder.

**Step 2.**

Git has hooks - actions that are executed depending on your action. We will use the `pre-commit` hook.

So, open the `hooks` folder and create a new file `pre-commit` with the next content:

```bash
#!/bin/sh
echo "error"
exit 1
```

Now try to commit your changes. You should receive the error

![Git Commit Error](https://ik.imagekit.io/VladislavAntonyuk/vladislavantonyuk/articles/1/git-commit-error.png)

Now replace the content with ```exit 0``` and try to commit again. All your changes are committed.

**Step 3.**

Now let's add our code inspectors to the `pre-commit` file.

I will describe my 3 favorites which I used many times.

1. dotnet format. This utility goes through all your files in solutions and formats the code according to your style rules.

Add the next code to your `pre-commit` file:

```bash
$solution="YourSln.sln"
dotnet tool install -g dotnet-format
dotnet format $solution --check
status=$?
[ $status -eq 0 ] && echo "No errors found" || dotnet format $solution
exit $status
```

So first we install the tool. Then we check if our solution has any errors. If any we run formatting and check the exit code of the operation.

2. Jetbrains.Resharper.CommandTools - powerful tools that can help you not only inspect the code but also clean up it and find duplicates.

Add the next code to the beginning of your `pre-commit` file: 
```bash
dotnet tool install -g JetBrains.ReSharper.GlobalTools
jb inspectcode $solution --properties:Configuration=Release --output="result.xml"
jb cleanupcode $solution
```

### Summary ###

So using git hooks you can control your actions with a repository.

Code inspectors should help you automatically analyze and format your code to follow your preferences.

You can find more examples on my GitHub: [XamarinAndroidFloatingWindow](https://github.com/VladislavAntonyuk/XamarinAndroidFloatingWindow "Xamarin Android Floating Window"){target="_blank"}