# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.

installer:
	@$(MAKE) -C noobmusic/installer installer

package:
	@$(MAKE) -C noobmusic/installer make-archive

l10n-package:
	@$(MAKE) -C noobmusic/installer make-langpack

mozpackage:
	@$(MAKE) -C noobmusic/installer

package-compare:
	@$(MAKE) -C noobmusic/installer package-compare

stage-package:
	@$(MAKE) -C noobmusic/installer stage-package make-buildinfo-file

sdk:
	@$(MAKE) -C noobmusic/installer make-sdk

install::
	@$(MAKE) -C noobmusic/installer install

clean::
	@$(MAKE) -C noobmusic/installer clean

distclean::
	@$(MAKE) -C noobmusic/installer distclean

source-package::
	@$(MAKE) -C noobmusic/installer source-package

upload::
	@$(MAKE) -C noobmusic/installer upload

source-upload::
	@$(MAKE) -C noobmusic/installer source-upload

hg-bundle::
	@$(MAKE) -C noobmusic/installer hg-bundle

l10n-check::
	@$(MAKE) -C noobmusic/locales l10n-check

ifdef ENABLE_TESTS
# Implemented in testing/testsuite-targets.mk

mochitest-browser-chrome:
	$(RUN_MOCHITEST) --flavor=browser
	$(CHECK_TEST_ERROR)

mochitest:: mochitest-browser-chrome

.PHONY: mochitest-browser-chrome

endif
