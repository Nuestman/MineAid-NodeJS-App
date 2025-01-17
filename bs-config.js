module.exports = {
    proxy: "http://localhost:3001", // Your local server address
    files: ["public/views/*.ejs", "public/**/*.css", "public/**/*.js"], // Watch these files for changes
    reloadDelay: 500,
    notify: false, // Disable the "Browsersync connected" notification
    open: false, // Prevent opening a new tab every time you start the server
    injectChanges: true,
};


