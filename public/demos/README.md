# App Archives

Every app in DosKit's selector runs from a ZIP archive in this folder, named after the app's id:
`panic.zip` belongs to the `panic` app. Vite copies `public/` into the build unchanged, so the app
downloads its archive from `/demos/<id>.zip` on DosKit's own site, and the archive's files become
the directory its autoexec mounts as `C:`.

This file records, for each archive, what it holds, where it came from and the terms its authors
attached to it. Years and credits come from the archive's own files where they say; where they do
not, from the package its files were taken from. Party results are those of
[pouet.net](https://www.pouet.net) and [Demozoo](https://demozoo.org), unless the archive gives
them.

| Archive               | Program                      | By               | Year | Terms                                                     |
| --------------------- | ---------------------------- | ---------------- | ---- | --------------------------------------------------------- |
| `second-reality.zip`  | Second Reality               | Future Crew      | 1993 | Freeware; source and data in the public domain since 2013 |
| `impulse-tracker.zip` | Impulse Tracker 2.14 Patch 3 | Jeffrey Lim      | 1997 | Freeware for non-commercial use; source now BSD 3-Clause  |
| `starport-bbstro.zip` | StarPort BBS Intro II        | Future Crew      | 1993 | Public domain                                             |
| `scream-tracker.zip`  | Scream Tracker 3.21          | Future Crew      | 1994 | Freeware                                                  |
| `unreal.zip`          | Unreal                       | Future Crew      | 1992 | Freeware                                                  |
| `panic.zip`           | Panic                        | Future Crew      | 1993 | Freeware                                                  |
| `squid-bbstro.zip`    | Squid BBS intro              | cld & The Doctor | 1994 | Freeware                                                  |
| `3drotate.zip`        | 3D rotation demo             | Draeden of VLA   | 1993 | None found                                                |
| `stars.zip`           | Starfield demo               | Draeden of VLA   | 1993 | None found                                                |
| `crystal-dream-2.zip` | Crystal Dream 2              | Triton           | 1993 | None found                                                |

"Freeware" is the authors' own word, and each entry below quotes what they meant by it. Sizes are in
bytes.

## `second-reality.zip`

**Second Reality** by Future Crew, the winner of the PC demo competition at Assembly '93.

- **Year**: 1993. README.1ST: "Copyright (C) 1993 by the Future Crew" and "Released on the 7th of
  October 1993". The files are dated 4 to 12 October 1993.
- **Contents** (5 files; the ZIP is 2,122,910): `SECOND.EXE` (1,451,093), `REALITY.FC` (992,188),
  `FCINFO10.TXT` (48,462), Future Crew's information file, `README.1ST` (4,222) and `FILE_ID.DIZ`
  (378). Future Crew released the demo as two archives, `2NDREAL1.ZIP` and `2NDREAL2.ZIP`; this one
  holds the files of both.
- **Source**: `2nd_real.zip` in the Internet Archive's
  [demoscene_SecondReality-FutureCrew](https://archive.org/details/demoscene_SecondReality-FutureCrew),
  byte for byte (MD5 `d5222001b8485c4d8bb1b573f1a24276`).
- **Terms**: README.1ST: "This demo is freeware. It can be freely distributed without modifications.
  No money can be charged for it." In 2013, for the demo's 20th anniversary, its source code and
  data were published at [github.com/mtuomi/SecondReality](https://github.com/mtuomi/SecondReality)
  under the Unlicense, which dedicates them to the public domain. The files here are the 1993
  release, not a build of that source.
- **More**: [pouet.net](https://www.pouet.net/prod.php?which=63)

## `impulse-tracker.zip`

**Impulse Tracker 2.14**, with Patch 3, by Jeffrey Lim.

- **Year**: 1997. `IT.EXE` and every driver are dated 21 December 1997, and the newest release in
  UPDATE.TXT is "IT214 Patch 3 - Merry XMas guys!". IT.TXT says the tracker "was written on and off
  during 1995, but most of the work was completed in the summer holidays of '96"; the version here
  is the one from 1997.
- **Contents** (62 files; the ZIP is 1,047,473): `IT.EXE` (91,225); 34 sound drivers (`.DRV`) and 6
  MMX drivers (`.MMX`); the manual, `IT.TXT`, with 11 more text files (`UPDATE.TXT`, `DRIVERS.TXT`,
  `FILTERS.TXT`, `MIDI.TXT` and others), `IMPULSE.FAQ` and `FILE_ID.DIZ`; two example songs,
  `JEFF93.IT` and `CHRIS31B.IT`; `ITMIDI.CFG`, `IT256.ICO`, `FONTUPGR.EXE`, `MERGEKRZ.EXE` and
  `KEYBOARD.ZIP`, with alternative keyboard definitions. `IT.DOC`, the manual in Word format, which
  FILES.TXT lists, is not included.
- **Source**: `it214v3.zip` in the Internet Archive's
  [demoscene_ImpulseTracker214](https://archive.org/details/demoscene_ImpulseTracker214), byte for
  byte (MD5 `3833d29083b170cb563e50baa011eacc`).
- **Terms**: IT.TXT, section 6: "YOU MAY NOT CHARGE ANYTHING FOR THIS PROGRAM - DISTRIBUTORS WHO ARE
  INTERESTED IN THIS PROGRAM MUST WRITE TO ME FIRST AND HAVE MY APPROVAL!" and "THIS PROGRAM IS ONLY
  FREEWARE FOR NON-COMMERCIAL USE." FILES.TXT: "If you do distribute this program (and please do!),
  then I would be most grateful if you keep ALL of the files intact." Jeffrey Lim released the
  tracker's source code in 2014; it is now at
  [github.com/jthlim/impulse-tracker](https://github.com/jthlim/impulse-tracker), under the BSD
  3-Clause License. `IT.EXE` here is the 1997 build, not one made from that source.
- **More**: [pouet.net](https://www.pouet.net/prod.php?which=13366)

## `starport-bbstro.zip`

**StarPort BBS Intro II** (V1.0) by Future Crew, code by Psi and music by Skaven: a 1,993-byte intro
for StarPort, Future Crew's home BBS, with its source.

- **Year**: 1993. README: "Copyright (C) 1993 Future Crew". The release list in FCINFO12.TXT dates
  the intro, `STARPORT.ZIP`, 21 November 1993 and its source, `SP2SRC.ZIP`, 2 December 1993. Here
  `SP2.COM` is dated 20 November 1993, `SP2.ASM`, `MAKE.BAT`, `README` and `FILE_ID.DIZ` 26
  November to 1 December 1993, and `FCINFO12.TXT` 11 October 1990, though its header says
  02-DEC-1993.
- **Contents** (7 files; the ZIP is 33,424): `SP2.COM` (1,993), its source `SP2.ASM` (20,856),
  `MAKE.BAT` (86), which assembles it, `README` (281), `FILE_ID.DIZ` (148) and `FCINFO12.TXT`
  (66,094), Future Crew's information file; and `scene.org.txt` (2,714), scene.org's notice, which
  scene.org added in 2006 along with the ZIP's comment.
- **Source**:
  [`fcsp2src.zip`](https://files.scene.org/view/demos/groups/future_crew/code/fcsp2src.zip) in
  Future Crew's folder on scene.org, byte for byte (MD5 `d644bbefcc4f838d6b7f97d4a3232910`). The
  intro's own package there,
  [`starprt2.zip`](https://files.scene.org/view/demos/groups/future_crew/intros/starprt2.zip),
  names the program `STARPORT.COM`; it is byte for byte `SP2.COM`.
- **Terms**: SP2.ASM, the intro's source: "This code is released to the public domain. You can do
  whatever you like with this code, but remember, that if you are just planning on making another
  small intro by changing a few lines of code, be prepared to enter the worldwide lamers' club."
  FCINFO12.TXT, section 3: "All our demos, except the ones which we have created for different
  companies, are freeware. This means that you can copy and distribute them freely as long as you
  make no modifications to them. Also, no money can be charged for copying them."
- **More**: [pouet.net](https://www.pouet.net/prod.php?which=12217)

## `scream-tracker.zip`

**Scream Tracker 3.21** by Future Crew. FCINFO17.TXT calls it one of Future Crew's "own programs
made by Psi"; ST3.DOC, the manual, is by Edge of Electromotive Force.

- **Year**: 1994. In the archive it was taken from, `ST3.EXE`, `WHATSNEW.321` and `FILE_ID.DIZ` are
  dated 25 December 1994, and FCINFO17.TXT, of 6 December 1994, dates version 3.2 that same day.
- **Contents** (8 files; the ZIP is 176,562): `ST3.EXE` (126,252), the manual `ST3.DOC` (61,813),
  `TECH.DOC` (19,399), with the technical specifications of the S3M format, `WHATSNEW.321` (4,457),
  `FILE_ID.DIZ` (210), an example song, `ARMANI.S3M` (17,554), an example sample, `EXAMPLE.SMP`
  (5,412), and `FCINFO17.TXT` (33,345).
- **Source**: repacked from `scrmt321.zip` in the Internet Archive's
  [scrmt321_202207](https://archive.org/details/scrmt321_202207) (MD5
  `b2a1d2e8d907a4b206c18ec9397cd24d`). The eight files here are the same, byte for byte, as those in
  it. Left out are `FCSITE17.TXT`, Future Crew's list of distribution sites, which FCINFO17.TXT
  refers to; `SLI2IO`, an advert for the BBSes the archive went through; `SLEDGE.EXE`, a 3,457-byte
  compressed program; and two empty files. The repacking also lost the file dates, now 19
  November 2025.
- **Terms**: ST3.DOC, section 1.3: "The Scream Tracker is distributed as freeware, and this means
  that you can give it to your friends and distribute it in any way as long as no money is
  involved." FCINFO17.TXT, section 3: "All our demos and programs, except the ones which we have
  created for different companies, are freeware. This means that you can copy and distribute them
  freely as long as you make no modifications to them."
- **More**: [pouet.net](https://www.pouet.net/prod.php?which=13351)

## `unreal.zip`

**Unreal** by Future Crew, the winner of the PC demo competition at Assembly '92.

- **Year**: 1992. README.NOW: "Copyright (C) 1992 The Future Crew". `UNREAL.EXE` is dated 8 August
  1992, and Future Crew's release lists date `UNREAL.ZIP` 6 August 1992 and `UNREAL11.ZIP`, version
  1.1 for the Gravis UltraSound, 28 December 1993 (FCINFO17.TXT, in `scream-tracker.zip`). This
  archive is the 1992 release, for the Sound Blaster and Sound Blaster Pro.
- **Contents** (3 files; the ZIP is 1,314,736): `UNREAL.EXE` (2,310,375), `README.NOW` (4,521) and
  `DEMOSITE.COM` (1,104). `DEMOSITE.COM` is a TheDraw screen advertising ftp.uwp.edu, the FTP site
  "this file was gotten from"; it is not part of Future Crew's release.
- **Source**: `unreal.zip` in the Internet Archive's
  [unreal_zip](https://archive.org/details/unreal_zip), byte for byte (MD5
  `3280dd80073df3b3034b4eb412b6c6d6`).
- **Terms**: README.NOW gives only the copyright. Future Crew's information files cover all their
  demos: "All our demos, except the ones which we have created for different companies, are
  freeware. This means that you can copy and distribute them freely as long as you make no
  modifications to them. Also, no money can be charged for copying them." (FCINFO10.TXT, in
  `second-reality.zip`). PANIC.NFO lists Unreal among Future Crew's productions and says "They are
  all freeware."
- **More**: [pouet.net](https://www.pouet.net/prod.php?which=1274)

## `panic.zip`

**Panic** by Future Crew. PANIC.NFO credits Wildfire with most of the code, Psi with the music
player and the fractals, Trug with the greetings scroller, Purple Motion with the music, Pixel with
the graphics and Abyss with the 3D objects.

- **Year**: 1993. FILE_ID.DIZ: "Released 4th Feb 1993"; `PANIC.EXE` is dated 3 February 1993.
  PANIC.NFO says the demo "was originally meant to be released at THE PARTY 1992" (27 to 29 December
  1992, in Aars, Denmark) but had to be debugged first. It was shown in the party's PC demo
  competition, whose result, given by one of its organizers after the voting system failed, placed
  it 2nd.
- **Contents** (5 files; the ZIP is 916,997): `PANIC.EXE` (1,693,874), `PANIC.NFO` (21,248),
  `VOTING.FRM` (3,158), `FILE_ID.DIZ` (495) and `scene.org` (2,033), scene.org's notice.
  `GENERAL.CDN`, which PANIC.NFO lists among the demo's files, is not included.
- **Source**: `panic.zip` in Future Crew's folder on
  [scene.org](https://files.scene.org/view/demos/groups/future_crew/demos/panic.zip), byte for byte
  (MD5 `e64acdb4504d6897996c2ec38be5b927`).
- **Terms**: PANIC.NFO: "This demonstration is freeware. It means that you can spread and copy this
  as much as you want. In fact, we would like it very much if you did spread this, but only in its
  complete original condition." It also forbids changing the demo or using its material in other
  programs.
- **More**: [pouet.net](https://www.pouet.net/prod.php?which=479)

## `squid-bbstro.zip`

**Squid BBS intro** (`SQUID1.COM`) by cld & The Doctor: a 1,899-byte BBS advert with an AdLib music
player, with its source, commented in Portuguese.

- **Year**: 1994. Its source, SQUID1.ASM, is headed "SQUID1.ASM by cld & The Doctor 31-Jan-1994",
  and the program and its source are dated 7 February 1994.
- **Contents** (6 files; the ZIP is 21,014): `SQUID1.COM` (1,899), its source `SQUID1.ASM`
  (44,819), `MAKE.BAT` (37) and `FILE_ID.DIZ` (524), all dated 7 February 1994; `FILE_ID_.DIZ`
  (198), a plain-text description of 22 March 1994, which gives that day as the archive's last
  revision; and `ADLIBFM2.DOC` (22,101), Jeffrey S. Lee's "Programming the AdLib/Sound Blaster FM
  Music Chips", version 2.0 of 24 February 1992, where SQUID1.ASM says its AdLib programming
  information came from.
- **Source**:
  [`squid_bbs1a.zip`](https://files.scene.org/view/demos/compilations/lost_found_and_more/bbs/squid_bbs1a.zip)
  in scene.org's lost_found_and_more collection, byte for byte (MD5
  `ca75130553ba812a8b5fa7db75fcea19`). scene.org dates it 26 June 2022, and five of its entries
  record Windows creation times of 25 May 2019, so the ZIP itself was written then or later; the
  files in it keep their 1994 dates. `squid_bbs1b.zip`, next to it, is a later 1,800-byte version. The
  program and its source are also in
  [github.com/sceners/squid-bbstro](https://github.com/sceners/squid-bbstro).
- **Terms**: SQUID1.ASM: "This code is freeware, and you are free to use it as you want - but DO NOT
  make another small addy just changing the text and few bytes of code! If you use any portion of
  this code in your programs (e.g. the Adlib mini-player) remember to give the proper credits to the
  authors." ADLIBFM2.DOC: "This file may be used and copied freely so long as the applicable
  copyright notices are retained, and no modifications are made to the text of the document. No
  money shall be charged for its distribution beyond reasonable shipping, handling and duplication
  costs, nor shall proprietary changes be made to this document so that it cannot be distributed
  freely. This document may not be included in published material or commercial packages without
  the written consent of its author."
- **More**: [pouet.net](https://www.pouet.net/prod.php?which=52530)

## `3drotate.zip`

**3D rotation demo** by Draeden of VLA, the example program of VLA's tutorial "Intro To 3d
Rotations".

- **Year**: 1993. The tutorial, 3DROTATE.TXT, is dated 02/22/93, and the source, 3DROTATE.ASM,
  02/25/93.
- **Contents** (1 file; the ZIP is 2,991): `3DROTATE.EXE` (25,856). It prints "Coded by Draeden of
  VLA" when it exits.
- **Source**: the `3DROTATE` folder of
  [github.com/sceners/grumpys-source-pack-collection](https://github.com/sceners/grumpys-source-pack-collection),
  a copy of Grumpy's source pack, a collection of demo and intro source code that the repository
  dates to April 1994. The folder has the tutorial, the source and VLA.NFO, and `3DROTATE.EXE` is
  byte for byte the one there. It also holds a `3DROTATE.ZIP`, dated 25 February 1993, with a
  different, 4,157-byte build.
- **Terms**: none found. The tutorial, the source and VLA.NFO state none, and neither does the
  pack's FILE_ID.DIZ.

## `stars.zip`

**Starfield demo** by Draeden of VLA, the example program of VLA's tutorial "Intro To Starfields".

- **Year**: 1993. The tutorial, STARS.TXT, and the source, STARS.ASM, are dated 03/15/93.
- **Contents** (1 file; the ZIP is 1,482): `STARS.EXE` (3,787).
- **Source**: the `STARS` folder of
  [github.com/sceners/grumpys-source-pack-collection](https://github.com/sceners/grumpys-source-pack-collection),
  with the tutorial, the source and VLA.NFO. `STARS.EXE` is byte for byte the one there.
- **Terms**: none found. The tutorial, the source and VLA.NFO state none, and neither does the
  pack's FILE_ID.DIZ.

## `crystal-dream-2.zip`

**Crystal Dream 2** (Crystal Dream II) by Triton, which won the PC demo competition at The Computer
Crossroads 1993, held 29 to 31 May 1993 in Gothenburg. Demozoo credits Mr. H and Vogue with the
code, Lizardking and Vogue with the music, Vogue with the graphics and Loot with the 3D objects.

- **Year**: 1993. `CD2.EXE` is dated 31 May 1993, and it is the same program, by size and CRC-32, as
  the one in the party's own archive on scene.org,
  [`cd2_trn.zip`](https://files.scene.org/view/parties/1993/computer_crossroad93/demo/cd2_trn.zip).
- **Contents** (2 files; the ZIP is 2,074,898): `CD2.EXE` (3,154,579) and `scene.org` (2,033),
  scene.org's notice.
- **Source**: `cd2-trn.zip` in Triton's folder on
  [scene.org](https://files.scene.org/view/demos/groups/triton/cd2-trn.zip), byte for byte (MD5
  `5308764cab247fff82b2c813d4df00af`).
- **Terms**: none found. The archive has no readme or NFO, and `CD2.EXE` is compressed, so any text
  it shows cannot be read from the file.
- **More**: [pouet.net](https://www.pouet.net/prod.php?which=462),
  [Demozoo](https://demozoo.org/productions/175/)

## Adding an Archive

The steps for adding an app, its archive included, are in
[`src/dos-apps/README.md`](../../src/dos-apps/README.md). Give each new archive an entry here like
the ones above: what it holds, where it came from and whether it is that file byte for byte, its
year and authors with where they come from, and its terms, quoted, or that none were found.

Places to look for programs and for their history:

- The Internet Archive's [MS-DOS demoscene collection](https://archive.org/details/msdos_demoscene)
- [scene.org](https://www.scene.org/), the demoscene's file archive
- [pouet.net](https://www.pouet.net/) and [Demozoo](https://demozoo.org/), databases of productions
  and party results
- [sceners](https://github.com/sceners) on GitHub, scene packages with their sources

## Size and Caching

An archive is only downloaded when its app opens, but every archive is part of the repository and of
each deploy: the ten here come to 7.7 MB, the largest being `second-reality.zip` at 2.1 MB.

Once an app has been opened, the service worker keeps its archive in a cache of its own. The build
names that cache after a hash of every archive in `dist/demos/`, so adding, replacing or removing an
archive starts a new, empty cache with the next deploy, and each app downloads its archive again the
next time it opens.

To replace an archive, update its entry here too (contents, source, checksum), then open the app at
`/?app=<id>` and check that it still starts.

---

**Last Updated**: 2026-11-08
**Maintained By**: DosKit Project
