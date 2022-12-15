/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

/* import-globals-from ../head.js */

"use strict";

add_task(function* capture() {
  if (!shouldCapture()) {
    return;
  }

  requestLongerTimeout(20);

  let sets = ["TabsInTitlebar", "Tabs", "WindowSize", "Toolbars", "LightweightThemes"];
  yield TestRunner.start(sets, "primaryUI");
});
