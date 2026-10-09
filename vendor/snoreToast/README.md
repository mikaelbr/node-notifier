# SnoreToast

The executables in this directory are unmodified builds of
[SnoreToast](https://invent.kde.org/libraries/snoretoast) by KDE. SnoreToast is
licensed under the LGPL-3.0, see [LICENSE](./LICENSE).

## snoretoast-x64.exe

- Version: 0.9.1, KDE's own build from [KDE Craft](https://files.kde.org/craft/),
  copied as is.
- Source: [`snoretoast-v0.9.1.tar.bz2`](https://download.kde.org/stable/snoretoast/snoretoast-v0.9.1.tar.bz2)
  on [download.kde.org](https://download.kde.org/stable/snoretoast/), tag
  [`v0.9.1`](https://invent.kde.org/libraries/snoretoast/-/tags/v0.9.1).
- Build: [`scripts/vendor-snoretoast.sh`](../../scripts/vendor-snoretoast.sh)
  has the exact Craft archive URL and its SHA256. Run
  `scripts/vendor-snoretoast.sh --check` to download the archive and verify that
  the vendored exe is byte-identical to KDE's build.

## snoretoast-x86.exe

- Version: 0.7.0. KDE publishes no 32-bit build of newer versions.
- Source: tag [`v0.7.0`](https://invent.kde.org/libraries/snoretoast/-/tags/v0.7.0).
- Origin: added in commit `8f01da4` (October 2019, "Updated SnoreToast to
  0.7.0"), which does not record where the binary was downloaded from. The exe
  includes an Authenticode signature whose certificate names K Desktop
  Environment e.V., and its debug paths refer to a `RelWithDebInfo-0.7.0` build of `snoretoast-0.7.0`.
