/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

#filter substitution
#filter emptyLines

// Set defines to construct URLs
#define BRANDING_BASEURL noob.software
#define BRANDING_SITEURL www.@BRANDING_BASEURL@

// Shared Branding Preferences
// XXX: These should REALLY go back to application preferences
#include ../../shared/preferences.inc

// Branding Specific Preferences
pref("startup.homepage", "chrome://browser/content/music.xul");
pref("startup.homepage_override_url", "chrome://browser/content/music.xul");
pref("startup.homepage_welcome_url", "https://noob.software/#noobmusic");
pref("startup.homepage_welcome_url.additional", "https://noob.software/#noobmusic");

// Version release notes
pref("app.releaseNotesURL", "https://noob.software/#noobmusic");

// Vendor home page
pref("app.vendorURL", "about:");

pref("app.update.url", "");

// URL user can browse to manually if for some reason all update installation
// attempts fail.
pref("app.update.url.manual", "about:");
// A default value for the "More information about this update" link
// supplied in the "An update is available" page of the update wizard.
pref("app.update.url.details", "about:");

// Switch Application Updates off for unofficial branding
pref("app.update.enabled", false);

// Shared User Agent Overrides
#include ../../shared/uaoverrides.inc
