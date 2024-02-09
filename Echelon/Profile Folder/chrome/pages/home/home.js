const { PrefUtils, BrandUtils } = ChromeUtils.import("chrome://userscripts/content/echelon_utils.uc.js");
let gHomeBundle = document.getElementById("homeBundle");

// FOR PRE-FIREFOX 23 STYLE

let root = document.documentElement;
let searchText = document.getElementById("searchText");

let echelonStyle = PrefUtils.tryGetIntPref("Echelon.Appearance.Style");
let echelonHomepageStyle = PrefUtils.tryGetIntPref("Echelon.Appearance.Homepage.Style");
let echelonOldLogo = PrefUtils.tryGetBoolPref("Echelon.Appearance.NewLogo");


if (echelonOldLogo) {
	root.setAttribute("echelon-new-logo", echelonOldLogo);
}

// BROWSER NAME AND BRANCH (FOR ALT BRANDING)

root.setAttribute("browser-name", BrandUtils.getBrowserName());
root.setAttribute("update-channel", BrandUtils.getUpdateChannel());

// ECHELON STYLE

if (echelonHomepageStyle == 0) {
	root.setAttribute("no-snippet-icon", "true");
}

if (echelonHomepageStyle <= 1) {
	root.setAttribute("echelon-style", "1");
}

if (echelonHomepageStyle == 2) {
	root.removeAttribute("echelon-new-logo");
}

if (echelonHomepageStyle == 3) {
	root.setAttribute("echelon-new-logo", "true");
}

if (echelonHomepageStyle == 4) {
	root.setAttribute("echelon-style", "5");
	root.setAttribute("echelon-new-logo", "true");
	searchText.setAttribute("placeholder", "Search");
}

// SNIPPET RANDOMIZER

function percentChance(chance)
{
    return (Math.random() * 100) <= chance;
}

function snippetRandomizer() 
{
	let selector = ".snippet1";
	if (percentChance(75))
	{
		selector = ".snippet2";
	}

	document.querySelector(selector).hidden = true;
}

snippetRandomizer();

// TITLE TEXT

let product = BrandUtils.getFullProductName();
document.title = gHomeBundle.getFormattedString("title_format", [product]);

// HIDE IF USER WANTS BLANK PAGE FOR NEW TAB

if (location.href.startsWith("about:newtab"))
{
	let blank = PrefUtils.tryGetBoolPref("browser.newtabpage.enabled", true);
	if (!blank)
	{
		document.documentElement.hidden = true;

		// least nitpicking
		document.title = "New Tab";
	}
}

// SET UP SEARCH ENGINE

Services.search.getDefault().then(engine => {
	window.engine = engine;
	
	/* Only Google has a logo. Others use placeholder. */
	if (engine._name != "Google" && echelonHomepageStyle == 3)
	{
		document.getElementById("searchLogo").hidden = true;
		document.getElementById("searchText").placeholder = engine._name;
	}
});

function onSearchSubmit(e)
{
	if (window.engine && document.getElementById("searchText").value != "")
	{
		location.href = window.engine.getSubmission(document.getElementById("searchText").value)._uri.spec;
	}

	e.preventDefault();
}

/* The fucks at Mozilla decided to not let you inject markup with dtd anymore, so we have to do this.
   (https://bugzilla.mozilla.org/show_bug.cgi?id=1539759) */
document.getElementById("defaultSnippet1").innerHTML = gHomeBundle.getString("snippet_1");
document.getElementById("defaultSnippet2").innerHTML = gHomeBundle.getString("snippet_2");
document.querySelector("#defaultSnippet1 a").href = "https://www.mozilla.org/firefox/features/?utm_source=snippet&utm_medium=snippet&utm_campaign=default+feature+snippet";
document.querySelector("#defaultSnippet2 a").href = "https://addons.mozilla.org/firefox/?utm_source=snippet&utm_medium=snippet&utm_campaign=addons";


// RESTORE PREVIOUS SESSION BUTTON
let { PrivateBrowsingUtils } = ChromeUtils.importESModule("resource://gre/modules/PrivateBrowsingUtils.sys.mjs");
Components.utils.import("resource:///modules/sessionstore/SessionStore.jsm", this);

function restoreLastSession()
{
	if (SessionStore.canRestoreLastSession)
	{
		SessionStore.restoreLastSession();
		document.getElementById("launcher").removeAttribute("session");
	}
}

if (SessionStore.canRestoreLastSession && !PrivateBrowsingUtils.isWindowPrivate(window))
{
	document.getElementById("launcher").setAttribute("session", "true");
}