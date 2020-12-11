# Ruspost Frontend

## How to develop locally

To test your changes locally you will need to run the ruspost backend API
(GitHub: RichStone/ruspost) first.

The HTML files in this repository are snippets of HTML copied from the published result of the
webflow page. They make it possible to test the frontend JavaScript code.

Once the API server from RichStone/ruspost is running locally, open the HTML file
and fire an event (e.g. click a button).

Make your changes first locally and make sure that they work under different test
conditions.

## How to bring changes to production

Once you've made your changes and tested them locally, it's time to bring them
to production.

The JavaScript scripts in this repository are used across the webflow application.

The process of bringing your frontend changes into the webflow application would
be as follows:

1. Push your changes to GitHub
1. In GitHub, make a new Release with a new higher version number (e.g. 1.0.9)
1. In webflow, bump up the version of the imported script (the scripts are imported
   like this: `<script async src="https://cdn.jsdelivr.net/gh/RichStone/ruspost-frontend@1.0.7/getTrackingResults.js"></script>`)
1. Make sure you bump up all the script's versions (on this multilingual page
   a script is usually used to provide functionality on **each** (translated) page)
1. You might also want to update the CSS (e.g. `tracking-form.css` is part of 
   `getTrackingResults.js` and also needs to be added to webflow's <head> style section
   of each translated page)

After bringing the code to production, make sure everything works as expected
on every (translated) page and that there is no console output in the browser
DevTools related to your work.