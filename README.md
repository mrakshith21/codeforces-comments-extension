# Codeforces Comment Extension

This is a React Chrome extension that classifies comments to relevant problems in the Codeforces tutorial pages.

This extension is still under development.


### NOTE
* Currently, only the `without-ml` branch is functional. It classifies comments based on pattern search. Though not perfect, it provides decent results. Please use this branch.
* You need to have `nodejs`, `npm` and `react` installed. 

## Install

1. Clone this repository
2. Install packages and build

```
npm install  
npm run build
```
This generates a `build` folder.

3. Load the extension to your browser.
  * Go to the Extensions page.
  * Enable developer mode.
  * Click `Load unpacked`.
  * Select the `build` folder that was generated.

## Use
* Go to a tutorial page on Codeforces. A sidebar appears with the list of problems, and a preview of relevant comment threads for each problem.
* Click on the preview of any comment to scroll to that thread. The comment is highlighted in yellow for a second to help you find it.

## Things to be added / fixed
* An option to hide / show the sidebar
* Use a combination of ML and pattern search to make the results better.
* Currently, only the first comment of a thread is considered for classification. We must find a way to consider the entire comment thread for classification.
* Improve extraction of text from comment when it contains links, images and so on.
* Use upvotes/downvotes to sort the results.





