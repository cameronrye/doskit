# Content Candidates

Vetted on 12 November 2026. Nothing below is in DosKit yet: these are the MS-DOS productions that
passed vetting, grouped into the shelves they would join, for the maintainer to decide what to add.

Every item below was run in DosKit's js-dos 8.3.20 build, on its default `dosbox` backend, through
the vetting harness, which hashes frames as DosKit's `src/utils/frameHash.ts` does, measures sound
and estimates flashing. "Preset demo" and "preset tracker" are DosKit's `presets.demo()` (30000
cycles, simple core, svga_s3, Sound Blaster 16 at 220/7/1/5, EMS/XMS/UMB on, 16 MB) and
`presets.musicTracker()` (18000 cycles). "--gus" adds a Gravis UltraSound at 240/5/3 with
ULTRADIR C:\ULTRASND, as Crystal Dream 2 has it. Sizes are in bytes.

Each item had two checks: the vetter's, then an independent skeptic's, who downloaded the archive
again, re-read the terms and ran it.

How the marks read:

- **[skeptic]**: the skeptic corrected the vetter, or found this alone; the text gives the
  skeptic's version.
- **[vetter only]**: the vetter saw it; the skeptic did not check it or could not reproduce it.
- **[this report]**: checked while writing this report.

Facts without a mark were seen by both the vetter and the skeptic. Each skeptic made up to two
runs of its own. Frame fingerprints (`ready.frames`) were measured with the harness's own autoexec
banner; DosKit's banner differs, so each one has to be measured again with
`e2e/tools/fingerprints.mjs` on a build (`src/dos-apps/README.md`, step 4).

## 1. Summary

### What was searched

- **Discovery**: nine angles, each with its own finder: demos of 1991-95, demos of 1996-2000,
  size-coded intros, Future Crew, trackers, musicdisks and other music, effects and educational
  code, openly licensed productions, and modern DOS productions. A completeness critic added 17
  leads. 219 leads were recorded, and 286 more were ruled out during discovery.
- **Triage**: 40 shortlisted and ranked, grouped into 9 proposed sets; 99 entries deferred or ruled
  out (some entries cover several productions); 4 upgrades to what DosKit ships proposed.
- **Vetting**: 48 items, each run in DosKit's js-dos build, with its archive downloaded and checked
  (size, MD5, listing) and its terms read in full. They were the 40 shortlisted, 5 the triage had
  deferred (Juice, Crystal Dream, Dope, Machines of Madness, Boost), and 3 upgrades (Unreal 1.1,
  the 2NDFIX patch, and VLA's two packages as one item). Two had a second try (Inconexia, Juice).
  Each of the 46 that the vetters recommended got an independent skeptic, who downloaded the
  archive again, re-read the terms and ran it.

### Outcome

- **Ready to add**: 42 productions in 43 archives (Journey has two), 30,273,113 bytes together,
  3.9 times the 7,719,481 bytes DosKit ships today. A free site serving each archive unmodified
  meets its authors' terms; two have no terms at all (Stars, Dope), and one needs a decision on how
  to meet its terms (Holistic).
- **Upgrades**: replace Unreal 1.0 with 1.1 (+22,576 bytes), and DosKit's one-file `3drotate.zip`
  and `stars.zip` with VLA's own packages (+42,020 bytes). The 2NDFIX patch for Second Reality is
  not worth shipping.
- **Not yet**: 3. Juice (only its party build runs past 2:45, and its last ~70 s are unseen),
  Crystal Dream (its second half went black and still in the only look at it), X14 (Orange should
  be asked first).
- **Rejected after vetting**: no production. The 2NDFIX upgrade and Juice's v1.1 archive were.
- **Corrections to DosKit's own documents**: 4 (section 6), among them ROADMAP.md's claim that X14
  is free to redistribute.

### Shelves, in the order to add them

The order weighs, in turn: the roadmap, how much of DosKit's code has to change, how strong the
terms are, how much of each production was seen running, and size. If size matters more than
continuity with what DosKit has, shelves 3 and 4 (356,830 bytes together) can come before shelf 2.

| #   | Shelf                                               | Productions    | Bytes                                   | Adds to today | Why here                                                                                                                                                                                  |
| --- | --------------------------------------------------- | -------------- | --------------------------------------- | ------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | Future Crew, part 1: intros, early demos            | 11             | 1,907,601                               | 24.7%         | ROADMAP's next content item ("A Future Crew shelf"). Future Crew's freeware terms are the ones DosKit already relies on for Unreal. No code change; every one ran.                        |
| 2   | Assembly '94 podium                                 | 3              | 3,413,413                               | 44.2%         | Assembly '94's whole top three, after DosKit's Unreal ('92) and Second Reality ('93); triage ranks 1, 2 and 11; terms in each archive; no code change. Holistic's terms need a decision.  |
| 3   | Assembly size-coded winners                         | 4              | 148,490                                 | 1.9%          | Four 4K and 64K winners of Assembly '95 to '97; the two 4Ks are now under their authors' MIT and CC0 licences. blind needs digit key names.                                               |
| 4   | Tran                                                | 2              | 208,340                                 | 2.7%          | Explicit terms in their own files; settings only.                                                                                                                                         |
| 5   | Iguana and VangeliSTeam                             | 6              | 1,270,046                               | 16.5%         | The Spanish scene, which DosKit lacks; Iguana's own release list puts these in the public domain. Two carry third-party music, three need settings beyond the preset, two or three flash. |
| 6   | Assembly '95 podium                                 | 2              | 3,591,983                               | 46.5%         | Stars (1st) and DX Project (3rd); 2nd place, Juice, is not yet. Stars has no terms and shows nudity.                                                                                      |
| 7   | Party winners beyond Assembly                       | 3              | 3,467,445                               | 44.9%         | The winners of The Party '93, The Gathering '95 and Wired '95; Dope has no terms.                                                                                                         |
| 8   | Type One of TFL-TDV                                 | 2              | 952,558                                 | 12.3%         | MIT-style licences from the author (2022); both ZIPs carry a nude text-art file.                                                                                                          |
| 9   | Future Crew, part 2: slideshow, diskmag, musicdisks | 4 (5 archives) | 4,226,762                               | 54.8%         | Completes the roadmap's Future Crew shelf, but needs digit keys, two new kinds and a decision on ROADMAP's "Not planned: A module player".                                                |
| 10  | Trackers beyond IT and ST3                          | 3              | 2,550,232 (5,607,092 with AT2's source) | 33.0% (72.6%) | Adlib Tracker II is ROADMAP item 4; it brings GPL duties, MONOTONE needs digit keys, EdLib needs Files-panel work.                                                                        |
| 11  | Assembly PC demo winners 1996-97                    | 2              | 8,536,243                               | 110.6%        | Machines of Madness and Boost: the largest archives, Pentium-class (cycles 'max'), endings unseen.                                                                                        |

All eleven together: 30,273,113 bytes, which would take DosKit from 7,719,481 to 37,992,594 bytes.
Overlaps with the triage's sets: Heartquake (shelf 2) and Pump (shelf 5) also belong to each
other's shelves and to "Party winners"; Composer 669 (shelf 4) is also a tracker; the StarPort BBS
Intro, BlasterSound #2 and Kukoo2 form the triage's "BBS intros" set beside DosKit's StarPort II
and Squid intro. Each is counted once above.

### Work shared across shelves

- **Digit key names.** `src/utils/dosKeys.ts` has none. blind (1, 4, 2), Slideshow I (9), MONOTONE
  (1, 0, 4) and Crystal Dream (2, 1, 6) need them (GLFW codes 48 to 57), and so does the key list
  in `src/dos-apps/README.md`, step 4. Fire Demo can avoid them by starting its player directly;
  Timeless and the Assembly '94 Pre-Invitation avoid them already.
- **Instructions for apps with no start keys.** DosKit shows `hint` only when a start recipe falls
  back (`showHint` in `src/components/DosPlayerWithApps.tsx`), so the hints vetters proposed for
  apps without `start` would never appear [skeptic, several items]. Their instructions belong in
  the description, the About panel or the page: Bussimatkaintro 93 (Down, Up, Escape, and an English
  summary of its Finnish text), Worldcharts, GR8 (+ and -), The Globe, the Assembly '94 Invitation
  Dentro (arrow keys), Timeless, Verses, Stars (no key works).
- **New kinds.** `musicdisk` (Journey, Chaotic Mind) and `diskmag` (Worldcharts): `AppKind`, the
  selector's order, the Play button's label, the structured data, the generated app lists and the
  tests that list apps by kind all name the kinds.
- **Licence texts** for the licences page and `public/demos/README.md`: the GPL v3 text and a
  CWSDPMI source notice (Adlib Tracker II); MIT notices (Animate, Kukoo2, Contrast); the MIDAS
  statement (Contrast); CC0 (Helium, optional).
- **Settings the builder already has**: `vgaonly` (Inconexia, Worldcharts, Kukoo2, Contrast),
  `sbpro2` (Inconexia, Composer 669), EMS/XMS/UMB off (Composer 669), `memsize: 32` (Adlib Tracker
  II), cycles `'max'` (Dope, Machines of Madness, Boost), the Gravis UltraSound (22 of the 42), and
  jsdos `renderAspect: "AsIs"` (Helium).
- **Flashing warnings** (`flashing: true`): Pump, Iris and Contrast, probably Inconexia (decide by
  eye); Untitled's interference rings need a look by eye. They would join Panic, Second Reality and
  Crystal Dream 2.

### Decisions for the maintainer

- **Holistic**: repack its four Cascada files (meets its NFO to the letter, but would be DosKit's
  first repack of an existing package) or serve it as is, with the BBS advert its NFO asks to be
  deleted.
- **"None found"**: Stars and Dope would make five archives without terms in "For Rights Holders"
  (seven with X14 and Crystal Dream).
- **Content**: two nude figures in Timeless's end picture; Stars' nude pin-up, which its artist
  himself rated "+21"; a bare-breasted mascot in Fishtro's exit picture; a nude text-art file in
  Kukoo2's and Contrast's ZIPs (neither program shows it); Boost's nude-shaped figure, vodka bottle
  and text about addiction. DosKit warns of flashing but has no field for content.
- **"No games"**: the Assembly '94 Invitation Dentro contains a small playable Space Invaders game,
  which cannot be switched off cleanly.
- **Kinds**: the two musicdisks against ROADMAP's "Not planned: A module player". The triage read
  that line as being about a player built into DosKit, not Future Crew's own disks.
- **Third-party material** that the authors' terms cannot cover: YO!'s music (David Whittaker's game
  tunes); Fire Demo's (Jester's "Elysium", listed under CC BY-NC-SA at The Mod Archive); Inconexia's
  main tune (DJ of Batman Group); Contrast's sprites and pictures; Kukoo2's player, tune and font;
  cover songs in Adlib Tracker II's and MONOTONE's song sets.
- **Years**, under DosKit's rule of dating the release the archive holds: Verses 1995 (shown in
  1994), Untitled 1994 (shown in 1993), blind 1997 (shown in 1996), Unreal 1.1 1993, MONOTONE 2017
  (first shown in 2008), Adlib Tracker II 2026 (first released in 2000). GR8 and YO! have
  conflicting years in Future Crew's own files.

## 2. Ready to add, by shelf

Each entry gives who made it, when and where it was shown, its terms as quoted from the file named,
its archive, how it ran in the harness, the skeptic's result and its caveats. "As is" means the archive can be served byte for byte as its source has it.

### Shelf 1. Future Crew, part 1: 11 intros and early demos, 1,907,601 bytes

ROADMAP's next content item. FCINFO17.TXT (06-DEC-1994, already in DosKit's `scream-tracker.zip`),
section 3: "All our demos and programs, except the ones which we have created for different
companies, are freeware. This means that you can copy and distribute them freely as long as you
make no modifications to them. Also, no money can be charged for our products." Its release list
names each of these except SOPPA [this report], and the four of shelf 9 too. FCINFO10 and FCINFO12 (in `second-reality.zip` and
`starport-bbstro.zip`) add two sentences several vetters left out [skeptic]: "If you are a PD
distributor, please contact us before including our products in your collection. In general, all
commercial utilization of our demos without our permission is forbidden." Three of the eleven
carry Future Crew's terms in their own archive (both Assembly '94 invitations, SOPPA); the other
eight rely on FCINFO files in other archives, as Unreal's entry already does. None needs a change
to DosKit's code; three need start keys DosKit already has names for.

#### 1.1 GR8 (`fc-gr8`), triage rank 36

- **By**: Future Crew. Its scroll text names the members HAL ("THE GRAPHIC CREATOR"), JPM, SIDDER
  and SS (Psi, "THE ONE WHO CAN PROGRAM"). Demozoo: SS code, Jpm graphics.
- **Year**: disputed. The archive points to January 1990: GR8.EXE is dated 5 January 1990, and the
  scroll text greets those at "ISO-SYÖTE AT THE TURN OF THE DECADE"; pouet says January 1990.
  Future Crew's release lists say 7-12-89 (12 July 1989, Demozoo's date), and FCINFO17's history
  puts GR8 under 1988 and says "In the year 1990 there was only one demo release from us, the
  Slideshow I." [skeptic]. 1990 is defensible; leaving the year out is the cautious choice.
- **Party**: none.
- **Terms**: none in its own archive. FCINFO17.TXT section 3 (above), and its release list: "GR8.ZIP
  31 kb 7-12-89 GR8 intro, EGA/No sound".
- **Archive**: the skeptic's choice, Hornet's copy
  <https://files.scene.org/get/mirrors/hornet/demos/1989/gr8.zip>, 31,109 bytes, MD5
  `f291a36b98fbb90adb4f5fcea4d544b8`: only Future Crew's seven files, the "31 kb" of FC's list, the
  file pouet links and the Internet Archive emulates [skeptic]. The vetted copy,
  <https://files.scene.org/get/demos/groups/future_crew/intros/gr8.zip>, 32,567 bytes, MD5
  `acb26ff9f34a137bd0efc7f32b3dafff`, adds scene.org's notice and comment. Either as is.
- **Runs**: `--preset demo --exe GR8.EXE`. No start keys. EGA mode 0Dh at 320x200 from 0.1 s; no
  sound, by design; flashing 0. Its pace comes from its own 200 Hz timer (the skeptic confirmed it
  in the code). It loops until Escape, which returns to DOS within 0.3 s. + and - set the scroll
  speed from 0 to 32; the default is about 4, so about four presses of - stop the text, whose
  letters keep bobbing [skeptic].
- **Skeptic**: confirmed with corrections.
- **Caveats**: the year; no terms of its own; DOSBox's `machine=ega` garbles it, but DosKit does not
  offer that machine [vetter only].

#### 1.2 YO! (`fc-yo`), triage rank 28

- **By**: Future Crew. Its member list: Psi (Coding), Hal (Graphics, Muzaxs), JPM (Swapping, Muzaxs),
  Dac (Hardware), Sid (Hardware). Demozoo's "SS" is Psi [skeptic].
- **Year**: disputed. The program says "by The Future Crew in 1990" (unpacked text) and "IT'S APRIL
  THE 1ST"; YO.EXE is dated 16 October 1990; pouet says April 1990. Future Crew's lists say
  2-24-89, and their histories put YO! in 1989 and Slideshow I alone in 1990 [skeptic].
- **Party**: none.
- **Terms**: none in the archive (its only text is scene.org's notice). FCINFO17 section 3, and its
  list: "YO!.ZIP 32 kb 2-24-89 YO! intro, VGA textmode/PC-speaker". On screen: "So please spread
  this demo... I hope you have practised spreading... If not, this is surely the time to learn!"
- **Archive**: <https://files.scene.org/get/demos/groups/future_crew/intros/yo.zip>, 27,988 bytes, MD5
  `f31f3c6eb2a3846a0eb940e5f810c4c8`, as is (the Internet Archive's and Defacto2's copies are the
  same file). It is scene.org's package of 2000; FC's list gives 32 kb. The IA's `yo_zip` (26,542
  bytes, MD5 `bf3e87ce5b57cc080e57de43116dbf5f`) holds the same YO.EXE without the notice [skeptic].
- **Runs**: `--preset demo --exe YO.EXE`. No start keys. 640x400 text mode, 80x50 with the 8x8 font
  [skeptic; the vetter said 80x25]; PC-speaker music; flashing 0. It loops (the top scroller takes
  about 2 min 45 s a pass) until Escape returns it to DOS. Keys 1 to 6 switch tunes and 0 stops the
  music [skeptic].
- **Skeptic**: confirmed with corrections.
- **Caveats**: YO.EXE holds an unused string, "FC-DEMO II (YO!) V0.9 - PROTOTYPE - DO NOT SPREAD!";
  no code reads it and it never showed (vetter and skeptic); mention it in the README entry. Psi's scroller
  says the music is David Whittaker's; pouet commenters identify the tunes as the Xenon 2 theme and
  Speedball [skeptic], which Future Crew's terms cannot license. The year.

#### 1.3 Mental Surgery (`fc-mental-surgery`), triage rank 16

- **By**: Future Crew: code Psi (and the logos), graphics Dr. Venkman (the fonts), music Lord Soth,
  texts and BBS Ice. Demozoo gives Lord Soth as Purple Motion's alias and names the music "Future
  Brain" [skeptic].
- **Year**: 1991. MENTAL.EXE (its "second version") is dated 14 July 1991; FC's list says 7-02-91;
  STMIK's banner says 1991. pouet 1991-07-15, Demozoo 2 July 1991.
- **Party**: none.
- **Terms**: none in the archive. FCINFO17 section 3, and its list: "MENTAL.ZIP 90 kb 7-02-91 Mental
  Surgery demo, SB/Covox/PC-speaker". FCINFO10 section 3's PD-distributor and commercial-use
  sentences (above).
- **Archive**: <https://files.scene.org/get/demos/groups/future_crew/demos/mental_s.zip>, 100,085
  bytes, MD5 `31601fbae41aa8ecb4b5ec102501f676`, as is (the IA's copy is the same file). Its
  source is in `stmik020.zip`, which DosKit does not need.
- **Runs**: `--preset demo --exe MENTAL.EXE --keys "4:Y, 4.4:N, 4.8:Y, 5.2:Enter, 5.6:Enter"`. Start:
  Y, N, Y, Enter, Enter with the default 250 ms gap, ready `{ "stdout": "STMIK02" }`; the skeptic
  confirmed the keys at DosKit's own pace. Sound Blaster 16 at 220h, IRQ 7. 320x200; flashing at
  most 1 a second. It loops until Escape (one pass of its scroller is about 15 minutes); Escape
  shows its end page and returns to DOS.
- **Skeptic**: confirmed with corrections. Its IRQ prompt reads "(2,3,5 or 7)", and any key other
  than 1, 3, 5 or 7 keeps IRQ 7, so Enter is right; a quote of its credits must keep "PSIAND" as the
  scroller has it.
- **Caveats**: it never ends by itself. The first 5-second window of music peaks at 0.53 against
  0.14 to 0.31 later, in the vetter's and the skeptic's runs; it may be a click.

#### 1.4 Assembly '92 Invitation Intro, "Fishtro" (`fc-fishtro`), triage rank 15

- **By**: Future Crew. Demozoo: Psi code, Purple Motion music, Pixel, Marvel and Skaven (the fishes)
  graphics, Gore text.
- **Year**: 1992. Future Crew's lists say 4-08-92, month first, so 8 April 1992 (vetter and skeptic);
  Demozoo's 4 August 1992 is wrong. FISHTRO.EXE is dated 21 October 1992.
- **Party**: the invitation to Assembly '92 (Kasavuoren koulukeskus, Kauniainen, Finland, 24 to 26
  July 1992, organised by Rebels and Complex; Future Crew sent the PC invitations). It was also
  entered in MEGA-Leif 1992's PC demo competition, placing unknown (FCINFO12: "We also competed with
  Fishtro in the MEGA-Leif PC demo compo, but we were never told who came second").
- **Terms**: the archive's only line is in the party text stored in FISHTRO.EXE: "FEEL FREE TO
  SPREAD THIS FILE!" PANIC.NFO, in DosKit's `panic.zip`: "Fishtro 0,53 Mb '92 A VGA / SB two part
  intro / You can download these products from our BBS or from another well equipped BBS for free.
  They are all freeware." FCINFO17 and FCINFO10, section 3.
- **Archive**: <https://files.scene.org/get/demos/groups/future_crew/intros/fishtro.zip>, 225,135
  bytes, MD5 `9094af929c405a8ed6ba1e5e8a78bd27`, as is (the IA's copy is the same file). Hornet's
  copy (227,650 bytes) adds an FTP-site advert [skeptic].
- **Runs**: `--preset demo --exe FISHTRO.EXE --keys "1:Enter"`. Start: Enter, ready
  `{ "stdout": "Press ESC to change the configuration" }` (printed 0.0 to 0.2 s after start); Enter
  takes its defaults, a 486 and a Sound Blaster at 220h, IRQ 7. A notice, "This version was
  originally distributed through Razor Europe", shows for about 3 s. Part 1 at 320x200, part 2 at
  316x200 (the scene of pouet's screenshot). Sound Blaster 16; flashing at most 1 a second. Its
  setup says the show lasts about 12 minutes; about 4 were watched. Escape shows a 640x480 drawing
  of the party's mascot, Melvin, for about 9 s, then an information screen, then DOS.
- **Skeptic**: confirmed with corrections (an unmentioned fourth copy; the 520K memory text shows
  only on its Escape setup path; a missing newline, which DosKit's end marker handles).
- **Caveats**: its terms come only from other archives. The EXE is the October 1992 "Razor Europe"
  build, the only one known. The ASSEMBLY.NFO its end screen names is in no known copy. Melvin is
  drawn bare-breasted. The exit screen gives 1992 addresses and phone numbers. Its natural end was
  not seen.

#### 1.5 StarPort BBS Intro (`fc-starport-bbs1`), triage rank 27

- **By**: Future Crew: code Psi, music Purple Motion (its own scroller).
- **Year**: 1992. Future Crew's lists: "STARPRT2.EXE 6 kb 9-13-92 StarPort BBS intro, VGA/AdLib"; the
  file is dated 13 September 1992; the intro says "AFTER 1 OCT 92 THE NUMBER IS +358-0-8044626".
- **Party**: none. It advertises StarPort, Future Crew's home BBS. It pairs with DosKit's StarPort
  BBS Intro II, whose INTRO.NFO says: "STARPORT.COM is a replacement for the ages old STARPRT2.EXE,
  which is completely out dated."
- **Terms**: none in the archive. FCINFO10 section 3, quoted as for Unreal, and the release-list line
  above.
- **Archive**: <https://files.scene.org/get/demos/groups/future_crew/intros/starprt1.zip>, 8,228 bytes,
  MD5 `b074029ecf9a6146e4ab1d7bcb46cc0d`, as is (the IA's and scene.org's lost_found copies are the
  same file). Its `starport.exe` is byte for byte the STARPRT2.EXE of the IA's `STARPRT2_zip`, which
  ties it to Future Crew's list entry.
- **Runs**: `--preset demo --exe STARPORT.EXE`. No start keys. A 640x350 16-colour graphics screen
  drawn to look like text: not text mode, as the vetter said [skeptic]. AdLib music through the
  SB16's OPL; flashing 0. The scroller loops about every 168 s [skeptic]; any key returns to DOS
  (tested with A [skeptic]), leaving its advert above the prompt.
- **Skeptic**: confirmed with corrections.
- **Caveats**: the description must not say "text mode". Not compared with real hardware. Future
  Crew's list calls it "StarPort BBS intro", and II "StarPort BBS intro II".

#### 1.6 The Party '92 Invitation (`fc-theparty92-invite`), triage rank 17

- **By**: Future Crew: idea and texts GORE, code Psi and Wildfire, graphics Pixel and Marvel, music
  Skaven (its credits page; Demozoo agrees).
- **Year**: 1992 ("Copyright (C) 1992 The Future Crew", printed by its "?" switch). The month is
  disputed: Future Crew's lists say 10-02-92 (2 October; Demozoo agrees), the files are dated 1
  November 1992, pouet says November 1992.
- **Party**: the invitation to The Party 1992 (MesseCenteret, Aars, Denmark, 27 to 29 December 1992),
  whose PC competitions Future Crew ran and where Panic came 2nd.
- **Terms**: none in the archive. FCINFO17 section 3, and its list: "THEPARTY.ZIP 165 kb 10-02-92 The
  Party II invitation intro, SB/SBp". THEPARTY.TXT: "This textfile was written by GORE / Future Crew
  and is intended to be spread on the PC demo scene in order to get as many PC freaks at THE PARTY 2
  as possible."
- **Archive**: <https://files.scene.org/get/demos/groups/future_crew/intros/theparty.zip>, 168,372
  bytes, MD5 `9a19f45a6669435aea3c541709bff501`, as is. The Hornet copy that pouet and Demozoo link
  adds an FTP-site advert.
- **Runs**: `--preset demo --exe THEPARTY.EXE`. No start keys; it finds the SB16 itself. 320x200;
  flashing at most 1 a second. Its 20 s frame is pixel for pixel Demozoo's screenshot. About 6
  minutes long (captures of 358 and 368 s); its natural end was not seen. Escape ends it: a "the
  end..." logo, an information screen, and DOS about 11.5 s after the key [skeptic; the vetter
  thought Escape did nothing].
- **Skeptic**: confirmed with corrections.
- **Caveats**: GORE's 1992 name, address, phone and fax are in THEPARTY.TXT and on its exit screen;
  keep them off the page.

#### 1.7 Assembly '93 Invitation Intro (`fc-asm93-invite`), triage rank 13

- **By**: Future Crew: code Trug, music player Psi, music Purple Motion (an 8-channel S3M; Demozoo
  names it "World of plastic"), graphics Marvel, texts and maps Gore and Jake.
- **Year**: 1993 ("Released: 15th of June 1993", README.1ST).
- **Party**: the invitation to Assembly '93 (30 July to 1 August 1993, Nikkarin yläaste school,
  Kerava, Finland).
- **Terms**: none in the archive. FCINFO17 section 3, and its list: "ASM-93.ZIP 400 kb 6-15-93
  Assembly'93 invitation intro, SB/SBp/GUS" (in section 5 of FCINFO17, section 9 of FCINFO10 and
  12 [skeptic]).
- **Archive**: <https://files.scene.org/get/demos/groups/future_crew/intros/asm-93.zip>, 401,354 bytes,
  MD5 `fa66afc09fe385cc1a84e1f71b7c1a77`, as is (the IA's copy is the same file). 58% of it is three
  scanned road maps with Future Crew's notes, third-party map material that must stay in an
  unmodified archive [skeptic].
- **Runs**: `--preset demo --gus --exe asm-93.exe`. No start keys with the GUS (without one it asks
  for a mixing rate). 640x480 in 16 colours; GUS music; flashing 0; its pages keep the pace of
  AssemblyTV's capture within 5 s. About 10 minutes. Its last page asks the viewer to press Escape,
  so it does not return to DOS by itself [skeptic]; Escape shows Future Crew's contact screen and
  returns to DOS in 0.8 s.
- **Skeptic**: confirmed with corrections. The proposed hint would never show. Its background reads
  "ASSEMBY '93", misspelt in the original; the intro states "CODED WITH PASCAL AND ASSEMBLER".
- **Caveats**: mostly pages of text over one background.

#### 1.8 Bussimatkaintro 93 (`fc-bussimatka93`), triage rank 38

- **By**: Future Crew, per pouet, Demozoo and FC's own lists. The intro and FILE_ID.DIZ bill Future
  Crew, The Movement and Accession, who organised the trip. Its credits page puns in Finnish:
  graphics "ihme" (perhaps Marvel), music "purppura liike" (perhaps Purple Motion), and "koodia ei
  tehnyt verihyhmä", a joke that names no coder (the skeptic's reading: "not made by Gore").
- **Year**: 1993. INTRO.EXE is dated 7 November 1993; FC's lists say 11-09-93.
- **Party**: the invitation to the Finnish bus trip to The Party 1993 (Herning, Denmark, 27 to 29
  December 1993); no placing.
- **Terms**: none in the archive. FCINFO17 section 3, and its list: "BUSMATKA.ZIP 75 kb 11-09-93
  Finnish invitation to Party3 bussymatka". FCINFO12, the information file current when it came out
  (in `starport-bbstro.zip`), lists it too [skeptic].
- **Archive**: <https://files.scene.org/get/demos/groups/future_crew/intros/busmatka.zip>, 76,023 bytes,
  MD5 `4aedc90c4a563f1dfed3d0aae134f195`, as is (the IA's copy is the same file).
- **Runs**: `--preset demo --gus --exe INTRO.EXE`. No start keys; it uses the GUS (the SB without
  one). 640x400; flashing at most 1 a second. Five pages of Finnish text: Down for the next, Up for
  the one before, Escape to DOS. It never ends by itself.
- **Skeptic**: confirmed with corrections. No hint can show for an app without `start`, so its keys
  and an English summary (a bus trip from Helsinki via Turku, Stockholm, Gothenburg and
  Frederikshavn to Herning, 26 to 30 December 1993, for 500 marks) belong in the description, the
  About panel or the page [skeptic].
- **Caveats**: Finnish only, and slight. Only Future Crew of the three billed groups has a terms
  statement. BUSMATK3.TXT gives the organisers' names and 1993 phone numbers.

#### 1.9 Assembly '94 Pre-Invitation Intro (`fc-asm94-preinvite`), triage rank 5

- **By**: Future Crew and Sonic PC (README.1ST): coding Mik / Sonic PC; design and other graphics
  Marvel / FC; Assembly '94 logo Pixel / FC; music Purple Motion / FC; texts GORE / FC.
- **Year**: 1994 ("Released on the 8th of April 1994").
- **Party**: the organisers' first invitation to Assembly '94 (Helsinki, 5 to 7 August 1994). Not the
  first overall: Demozoo also lists "Assembly 1994 Planetrip" of April 1994 [skeptic]. Its list of
  organisers (Accession, Future Crew, The Movement, Sonic PC and Carillon & Cyberiad) is the
  intro's own; Demozoo's and pouet's differ [skeptic].
- **Terms**: README.1ST: "This demo is freeware. It can be freely distributed without modifications.
  No money can be charged for it." FCINFO14.TXT, section 3, adds: "If you are a PD/shareware/freeware
  distributor, please contact us before including our products in your collection. If you do not
  hear from us in two weeks after sending us a fax or a letter, it will automatically mean that you
  can include our freeware demos in your collection." FCINFO10 and 12, which DosKit ships, ask this
  of "PD distributors" only, without the two weeks, and FCINFO17 drops it [skeptic].
- **Archive**: Hornet's copy, which pouet and Demozoo link,
  <https://files.scene.org/get/mirrors/hornet/party/invites/1994/asm-94.zip>, 221,410 bytes, MD5
  `06362579e50677c0789ca208f48bd36d`; or Future Crew's folder,
  <https://files.scene.org/get/demos/groups/future_crew/intros/asm-94.zip>, 221,697 bytes, MD5
  `28987b397771ebe2428b134256971fb3`, the same bytes apart from a 287-byte "DC-1" logo comment. Both
  as is; the vetter prefers Hornet's.
- **Runs**: `--preset demo --gus --sbtype none --exe ASM-94.EXE`, that is
  `presets.demo().setSoundBlaster({ sbtype: 'none' }).setGUS(...)`. Start: Enter, which its menu
  takes as "autodetect" (its own key for the GUS, 5, would need digit key names), ready
  `{ "stdout": "Select soundboard" }`. GUS music; 320x240, with a 640x480 logo picture; flashing at
  most 1 a second. It loops (about 213 s a pass) until Escape, which shows a contact screen and
  returns to DOS.
- **Skeptic**: confirmed with corrections. The second of 68x240 frames as it enters its main screen
  (about 18 to 20 s in) is real, and DosKit's 4:3 view will probably stretch that strip across the
  screen; look at it in the real player [skeptic].
- **Caveats**: it never ends by itself.

#### 1.10 Assembly '94 Invitation Dentro (`fc-asm94-invite`), triage rank 4

- **By**: Future Crew and Sonic PC (README.1ST): coding Mik / Sonic PC; design and graphics Marvel /
  FC; music Skaven / FC; music player Psi / FC; texts GORE / FC.
- **Year**: 1994 ("Released on the 3rd of July 1994").
- **Party**: the organisers' second MS-DOS invitation to Assembly '94 (the main Ice Hockey Hall,
  Helsinki, 5 to 7 August 1994); Demozoo lists six invitations to that party across platforms
  [skeptic].
- **Terms**: README.1ST: "This demo is freeware." "It can be freely distributed without
  modifications." "No money can be charged for it." FCINFO16.TXT, section 3, repeats FCINFO14's
  contact request with the two weeks; FCINFO17 drops it.
- **Archive**: <https://files.scene.org/get/demos/groups/future_crew/intros/asm-94_2.zip>, 568,996
  bytes, MD5 `e72dec9a4018aa49d07947ad47bbe304`, as is (the IA's copy is the same file). About half
  of it is two scanned maps that are part of the release. The party folder's copy (567,825 bytes)
  holds the same files with a BBS-logo comment; the skeptic still prefers this one.
- **Runs**: `--preset demo --gus --exe "ASM-94_2.EXE -q -c2"` (-q quick mode, -c2 the GUS). No start
  keys. 640x400 (a 320x400 mode); black for the first 12.5 s while the music plays; flashing 0. Its
  second part loops until Escape, which returns to DOS in about 1 s. The arrow keys move the ship in
  its Space Invaders game.
- **Skeptic**: confirmed with corrections. Its "-a" switch only empties the game's box, leaving the
  scoreboard and the text inviting a game, so the game cannot be removed [skeptic].
- **Caveats**: a small playable Space Invaders game is part of it (Demozoo tags it
  "game-included"): the maintainer's call under "no games". It never ends by itself.

#### 1.11 SOPPA! (`fc-soppa`), triage rank 14

- **By**: Future Crew. Demozoo: Psi code, Purple Motion music ("Kermavaahto (aka. Soppaaa)"), Marvel
  graphics; pouet credits Marvel only.
- **Year**: 1994. SOPPA.EXE is dated 6 August 1994, during Assembly '94.
- **Party**: Assembly '94 (Helsinki, 5 to 7 August 1994), PC 64K intro competition: not shown; it
  "Failed the pre-selection process" (Demozoo).
- **Terms**: FCINFO16.TXT, inside this party package, section 3: "All our demos, except the ones which
  we have created for different companies, are freeware." / "This means that you can copy and
  distribute them freely as long as you make no modifications to them. Also, no money can be charged
  for copying/spreading them." FCINFO17 leaves SOPPA off Future Crew's release list.
- **Archive**: the party copy,
  <https://files.scene.org/get/parties/1994/assembly94/in64/soppa.zip>, 78,901 bytes, MD5
  `5826578f4be6167aa97162cccd0cce0d`, as is. Not the copy in Future Crew's folder (62,383 bytes),
  which has no terms and a BBS advert for FILE_ID.DIZ.
- **Runs**: `--preset demo --gus --exe SOPPA.EXE`. No start keys. Black for about 10 s with music;
  320x240, with a 640x480 title from 29.4 to 36.9 s; GUS; flashing at most 2 a second. It returns to
  DOS by itself at about 128 to 129 s [skeptic: it varies by about a second]. Its logo frame is pixel
  for pixel Demozoo's screenshot, and its timeline is within about 1 s of a 128 s capture, whose
  hardware is not stated [skeptic]. On the SB16 alone its pauses stretch the run to about 150 s, so
  it needs the GUS.
- **Skeptic**: confirmed with corrections (its ZIP comment reads "DC-1"; DosKit's browser test needs
  nothing special for its black opening).
- **Caveats**: a 2002 pouet comment asked whether it was really Future Crew's; Future Crew's own
  files in the package and Demozoo's credits support it.

### Shelf 2. Assembly '94 podium: 3 demos, 3,413,413 bytes

Assembly '94's whole PC demo top three. With Unreal (1992) and Second Reality (1993), DosKit
would have the Assembly winners from 1992 to 1994 and that year's podium. Each archive has its
authors' terms; Holistic's need a decision. No code change. None was watched to its end.

#### 2.1 Verses (`verses-emf`), triage rank 1

- **By**: Electromotive Force (EMF): code Saracen, The Grim Reaper, Devastator and Saint; music
  Whalebone ("Double Trouble"; he also drew the ripple picture and the end logo); graphics Saracen,
  including the "Bill Gates" writer [skeptic], and The Grim Reaper; "verses" logo Shaman & Kerberos;
  gouraud objects Vortex. It runs under Tran's PMODE.
- **Year**: 1995 under DosKit's rule of dating the release the archive holds: this is Revision II,
  "Released on the 26th of April, 1995" (VERSES.NFO). The demo first came out on 17 August 1994 by
  EMF's own files (Demozoo says 13 August, pouet 1994-08-15).
- **Party**: Assembly '94 ("The Third Phase", 5 to 7 August 1994, the Helsinki Ice Hall [skeptic]),
  PC demo competition: 1st, ahead of Holistic and Heartquake.
- **Terms**: VERSES.NFO: "This demo is freeware. It can be freely distributed as long as the files or
  the contents of the archive are not modified in any way. No money can be charged for this demo. We
  grant exclusive rights for CD-ROM distribution of this demo to the organizers of Assembly'94, and
  demand a 3.2% royalty from the net revenue, as stated in the ASM94_2.TXT info file." ASM-94_2.TXT
  (scene.org's assembly94/info) shows the clause covers only the Assembly '94 CD-ROM [skeptic].
  Quote the paragraph whole.
- **Archive**: <https://files.scene.org/get/parties/1994/assembly94/demo/emf_vrs2.zip>, 509,344 bytes,
  MD5 `2c43b47524fa11c90c89c403d0f5460b`, as is (the IA's copy is the same file). Not the 1994 party
  version (`emf_vrs.zip`, `verses.zip`), which is GUS-only and hangs on fast machines.
- **Runs**: `--preset demo --gus --exe "VERSES.EXE !"`. No start keys: "!" is its "no questions
  asked" mode, which picks the GUS. Without "!": Enter, ready
  `{ "stdout": "with base address 0240h" }`. GUS music throughout; 320x200, and 640x480 for its IFS
  part (about 23 to 61 s); flashing at most 2 a second (one fade to white at about 110 s). About
  4:28 by a Pentium 120 capture; its last ~30 s (credits, end logo, return to DOS) were not seen. By
  its fourth minute its parts run up to ~7 s behind that capture. Escape quits cleanly.
- **Skeptic**: confirmed with corrections. Its Sound Blaster runs are [vetter only].
- **Caveats**: with the year 1995, keep "1994" out of the description and banner (DosKit's year
  test reads four-digit years). With "!" it has no `start`, so the proposed hint would never show
  [skeptic].

#### 2.2 Holistic (`holistic-cascada`), triage rank 11

- **By**: Cascada VR Section: code Hellraiser (Roberto Chaves) and Robban (Robert Adolfsson);
  graphics Mirage (Matte Johansson); music and effects Zodiak (Erik Stridell), whose module is
  "Shelter".
- **Year**: 1994. This is the post-party release: its files are dated 9 September 1994, and its NFO
  and setup already give the 2nd place.
- **Party**: Assembly '94 (Helsinki), PC demo competition: 2nd, with 726 points.
- **Terms**: HOLISTIC.NFO: "This demo is freeware, please distribute it to all your fellow
  computerusers as long as you keep the archive as it was when you got it and delete any irrelevant
  BBS-ads." and "No part of Holistic may be tampered with or removed without a written permission
  from the authors." Every copy found carries LOINEN.COM, a "Land of ice PCB" BBS advert dated the
  day after Cascada's files, and a "DC-1" logo comment: scene.org's party copy, the IA's and
  Defacto2's (one and the same file [skeptic]) and Hornet's. The skeptic reads the grant as one
  condition with two parts: served as is, the archive keeps an advert the authors asked to be
  deleted. The copy that meets the terms to the letter is a repack of the four untouched Cascada
  files with their dates, which the NFO allows ("Any other files found in this archive could be
  deleted as they are probably just some rotten BBS-adverts."), but which would be DosKit's first
  repack of an existing package [skeptic]. Its module carries "This song is 100% (c) 1994
  Fikonknecke" and says some samples were ripped from Basehead [skeptic].
- **Archive**: <https://files.scene.org/get/parties/1994/assembly94/demo/holistic.zip>, 1,067,064 bytes,
  MD5 `602e7dd6af2389a8ddcd08d4a349c921`. It can be served as is, but see the terms.
- **Runs**: `--preset demo --exe HOLISTIC.EXE --keys "0.5:Right*4, 2.6:Enter"`. Start: Right four
  times (Sound Blaster 16 at 220, DMA 5, IRQ 7) and Enter, ready `{ "frames": [1757433617] }`. DosKit
  sends a start of several keys once, and Rights sent earlier than 0.4 s were not tested, so check on
  the dev server that the setup reaches the SB16 screen (fingerprint 2697038045) before Enter
  [skeptic]. Sound Blaster 16 only: with the GUS its music hangs at a random point (the vetter's
  runs; the DOSBox-X chart lists the same fault for DOSBox SVN). 320x200, with a 640x400 setup and
  closing title; flashing at most 2 a second. About 4:32 (a 272 s capture); its last ~80 s (the title
  part, the end and the return to DOS) were not seen. On the SB16 its late parts run up to ~2.6 s
  behind the GUS timeline [vetter only].
- **Skeptic**: confirmed with corrections.
- **Caveats**: the terms decision; the GUS cannot be used.

#### 2.3 Heartquake (`iguana-heartquake`), triage rank 2

- **By**: Iguana (Madrid): code JCAB, Jare, ARM and COI; music Noisy Man, COI and Ryan Cramer
  (guest); graphics Kronos, COI, Raúl Ortega (guest) and Nefron. It also belongs to shelf 5.
- **Year**: 1994. HEARTQ.NFO ends "Madrid, 23rd of August, 1994"; this is the post-party release,
  with files of 23 to 25 August 1994.
- **Party**: Assembly '94 (Helsinki), PC demo competition: 3rd.
- **Terms**: HEARTQ.NFO: "The package can be distributed freely without modification. No money can be
  charged for it, other than standard fees for access to a BBS, or the cost of the material the
  demonstration is recorded on. It can not be used to add value to a commercial product; however,
  shareware distributors can put it in their collections, be it CD-ROM or floppy disks and similar
  computer media, as long as it's sold together with other shareware of public domain programs in
  the same package; never can this demonstration be alone in the sold package, or be the first
  reason to give the customer in order to get him interested." Iguana's RELEASES.TXT grant gives way
  to these ("except when stated otherwise in the package").
- **Archive**: Iguana's own home BBS copy,
  <https://files.scene.org/get/mirrors/scenesp.org/compilations/blastersound_bbs/IGUANA/HEARTQ.ZIP>,
  1,837,005 bytes, MD5 `0c6da58f5c33b1ecb946912125660bf6`, as is. It holds BLASTER.COM, Iguana's
  intro for that BBS, and the BBS's advert as its ZIP comment. Not the party folder's `heartq.zip`
  that pouet links (1,946,860 bytes, MD5 `e6ce9a8ab48ee82a5633054421162baa`), a third-party repack
  without BLASTER.COM, which would add 25.2% rather than 23.8% [skeptic].
- **Runs**: `--preset demo --gus --exe HEARTQ.EXE --keys "3.2:Enter"`. Start: Enter ("Run the demo";
  the setup has chosen the GUS from ULTRASND), ready `{ "stdout": "Use HEARTQ /? to see the help
text." }`; an Enter sent as early as 0.31 s is buffered and taken [skeptic]. GUS; a 640x400 setup,
  then 320x200; flashing at most 3 a second, never over. Its end was not reached: the water credits
  ran at least 74 s without returning to DOS. A real DX4-100 capture is 329 s long and a 2011 DOSBox
  capture 592 s.
- **Skeptic**: confirmed with corrections. Its timeline matches the DX4-100 capture within about a
  second, except that its screen melt takes 2.5 s instead of 4.4 s, so the "24,000 DOTS" screen and
  the dots part come about 3 s early, until the music-timed explosion part [skeptic].
  iguanademos.com is still Iguana's own site [skeptic].
- **Caveats**: its length and its end are unknown; the Sound Blaster path is untested; Space skips a
  part, so DosKit must not send it.

### Shelf 3. Assembly size-coded winners: 4 intros, 148,490 bytes

Assembly's PC 4K winners of 1995 and 1997 and its PC 64K winners of 1995 and 1996, 1.9% of what
DosKit ships today. The two 4Ks now have open licences from their authors. blind needs digit key
names.

#### 3.1 Animate (`schwartz-animate`), triage rank 10

- **By**: Schwartz (Mikko Reinikainen, Nummela, Finland), alone.
- **Year**: 1995. Its files are dated 10 August 1995, and ANIMATE.COM itself carries "Copyright (c)
  1995 Mikko Reinikainen, schwartz@cute.fi" [skeptic].
- **Party**: Assembly '95 (Helsinki Fair Centre, 10 to 13 August 1995), PC 4K intro competition:
  1st of 15, with 2,100 points.
- **Terms**: ANIMATE.TXT (1995): "Animate is my contribution to the Assembly '95 4kb intro
  competition. It's not freeware. You are allowed to copy it without restrictions for non-commercial
  use." It also forbids any charge, commercial use and changes. In 2020 the sole author released it
  under the MIT License (github.com/mtreinik/animate, README: "The program and its source code is
  released here under the MIT license by the sole author, Mikko Reinikainen aka schwartz."), and the
  repository's ANIMATE.COM and ANIMATE.TXT are byte for byte the party's; the README calls the 1995
  text "no longer valid". Put the MIT copyright line and permission notice on its page and in
  `public/demos/README.md`; do not label it "Freeware"; leave ANIMATE.TXT's 1995 home address off the
  page [skeptic].
- **Archive**: <https://files.scene.org/get/parties/1995/assembly95/in4k/animate.zip>, 5,193 bytes, MD5
  `b380378d7f4637b361505bb1ce005117`, as is. It is the party's ANIMATE.ZIP (4,906 bytes) with a
  287-byte comment added by whoever packed the party's files, so only the two files inside are byte
  for byte the party's [skeptic].
- **Runs**: `--preset demo --exe ANIMATE.COM`. No start keys. 320x200; no sound, by design; flashing
  at most 2 a second. It ends by itself at about 48.5 s; Escape ends it at once.
- **Skeptic**: confirmed with corrections.
- **Caveats**: compared only with the author's DOSBox captures and pouet's screenshot. A share card
  at about 12 s or 27 s.

#### 3.2 Drift (`drift-wildlight`), triage rank 25

- **By**: Wild Light: code Asmu and Vulture; music Nobody; graphics Odd Monk and Preacher; PMODE by
  Tran.
- **Year**: 1995 (DRIFT.TXT: "released at the Assembly'95 10-13.08.1995"; its setup says
  "13-08-95").
- **Party**: Assembly '95 (Helsinki Fair Centre), PC 64K intro competition: 1st.
- **Terms**: DRIFT.TXT: "This material is not freeware. You are allowed to copy it without
  restrictions for non-commercial use." / "No payment of any kind may be charged for this product or
  any combination of products or services including this product without our authorization and
  official written license." It also forbids changes. Do not label it freeware.
- **Archive**: <https://files.scene.org/get/parties/1995/assembly95/in64/drift.zip>, 72,338 bytes, MD5
  `8fa434e9d66f725b627507ab01960f68`, as is (the IA's copy is the same file). It also holds
  CALL_NOW.COM, a Triplex BBS advert, and scene.org's notice.
- **Runs**: `--preset demo --gus --exe DRIFT.EXE`. Start: Enter, Down, Down, Down, Enter, Down, Down,
  Enter (Gravis Ultrasound, port 240H, IRQ 5), ready `{ "frames": [2145475191] }`. GUS; 320x200, and
  a 640x480 end scroller; flashing at most 2 a second. It returns to DOS by itself about 223 s after
  the intro starts, 228.5 s after DOSBox started at DosKit's pace [skeptic].
- **Skeptic**: confirmed with corrections. Keys sent 0.22 s after its setup screen appeared took;
  DosKit may send them 0.1 s after, which is untested, and an 8-key start is sent only once, so
  DosKit's browser test must confirm the start. "It needs a GUS" is stronger than the tests: Sound
  Blaster Pro on the SB16 failed, and plain Sound Blaster and `sbpro2` were not tried [skeptic].
- **Caveats**: a dropped first key would choose No Sound. A wrong IRQ gives a white screen [vetter
  only].

#### 3.3 blind (`blind-eufrosyne`), triage rank 20

- **By**: Eufrosyne: code Suckho (Saku Tiainen); graphics and music Duke (Tomi Korkalainen), who is
  pouet's "Bay Tremore" [skeptic]; music player MXMPlay by Cubic Team; PMODE by Tran.
- **Year**: 1997 for this final version ("released 5.1.1997"); the production is from 1996 ("(c)
  eufrosyne 1996").
- **Party**: Assembly '96 (16 to 18 August 1996, Helsinki), PC 64K intro competition: 1st.
- **Terms**: BLIND.NFO: "license you can spread this intro freely. you can add this intro on any
  CD-ROM, but please inform us. you must not modify anything in this intro or any files you got with
  it. we are not responsible for any damage this intro may cause." The group's own 2026 remaster
  package carries this ZIP byte for byte. "Freeware" is not the authors' word, so do not label it so
  [skeptic].
- **Archive**: <https://files.scene.org/get/demos/groups/eufrosyne/frs_blfn.zip>, 66,414 bytes, MD5
  `915107f4e323b672fa3520a602a34b74`, as is.
- **Runs**: `--preset demo --gus --exe BLIND.EXE --keys "2:1, 4:4, 6:2"`. Start: 1 (GUS), 4 (port
  240h, so the GUS must stay at 240) and 2 (play once), which need digit key names (GLFW 49, 52,
  50); ready `{ "stdout": "3. no sound" }`. GUS; 320x200. It returns to DOS about 159 s after the last
  key [skeptic; the vetter said 164]. Flashing peaks at 3 a second in one quarter of the picture,
  never over [skeptic].
- **Skeptic**: confirmed with corrections. The vetter's timing caveat does not hold: it follows
  scene.org's 2007 capture within about 0.2 s [skeptic].
- **Caveats**: digit key names. The NFO asks to be told of CD-ROM inclusion; a note to Suckho, who
  released the 2026 remaster, would honour it.

#### 3.4 Helium (`helium-ocsa`), triage rank 24

- **By**: viznut. pouet and Demozoo list it under ocsa; HELIUM.TXT says "(this is not a pwp production
  btw)".
- **Year**: 1997.
- **Party**: Assembly '97 (Helsinki Fair Centre, 8 to 10 August 1997), PC 4K intro competition: 1st
  of 8, with 1,748 points.
- **Terms**: `helium.zip` states none. HELISRC.NFO, in the author's source package `helisrc.zip`:
  "It's yours. Use it any way you like." viznut's own repository, github.com/viznut/demoscene (2021),
  puts Helium's source and its 3,756-byte build under CC0 1.0 [skeptic]. That build is the one in
  `helisrc.zip`; `helium.zip` holds the 3,761-byte build of 5 August, covered only as an earlier build
  of the same code [skeptic].
- **Archive**: <https://files.scene.org/get/parties/1997/assembly97/in4k/helium.zip>, 4,545 bytes, MD5
  `e81f64f385089e481694afa7cc02caa1`, as is (the IA's copy is the same file). Or the source package,
  <https://files.scene.org/get/demos/groups/ocsa/helisrc.zip>, 20,040 bytes, MD5
  `ac15d2df0b4c9f235daea662c7154158`, with the CC0 build and the grant, but without HELIUM.TXT.
- **Runs**: `--preset demo --exe HELIUM.COM`. No start keys. A 252x256 tweaked mode; AdLib music;
  flashing at most 1 a second. It returns to DOS by itself at about 95 s; Escape quits early. Give it
  jsdos `{ "renderAspect": "AsIs" }`: DosKit's 4:3 would stretch it about 35% wider.
- **Skeptic**: confirmed with corrections. "Mono" in its accuracy text would mislead, since an AdLib
  is mono [skeptic]. `helisrc.zip`'s build was not run by the skeptic.
- **Caveats**: a share card at about 21 s (the title) or 40 s (the tunnel).

### Shelf 4. Tran: 2 programs, 208,340 bytes

Thomas Pytel's tracker and his demo, both explicitly free in their own files. He also wrote PMODE,
the extender several other entries run under.

#### 4.1 Composer 669 1.3 (`tran-composer669`), triage rank 9

- **By**: Tran (Tomasz Pytel) of Renaissance, a New York group [skeptic].
- **Year**: 1992 (files of 2 to 4 December 1992).
- **Party**: none.
- **Terms**: FREEWARE.TXT: "Due to circumstances beyond our control, we are forced to release Composer
  669 as freeware." / "We hope that you may get some enjoyment out of this final release of Composer
  669 and use it as you wish, no strings attached." The right to host rests on FREEWARE.TXT alone:
  COMPOSD.DOC's older condition, "provided that all the files are included", is arguably not met,
  since this ZIP lacks the demo song, KEYS.TXT and REN-92.NFO that the earliest dated package has
  [skeptic].
- **Archive**: <https://files.scene.org/get/mirrors/hornet/music/programs/trackers/compsd13.zip>, 51,599
  bytes, MD5 `fc4190def6e2cbe49d3a97f7c1e45e0c`, as is (the IA's copy is the same file). It holds no
  song. The 1993 Media Share CD's fuller ZIP (89,796 bytes) has the song, but its COMPOSD.CFG breaks
  the start and the colours.
- **Runs**: `--preset tracker --noems --noxms --noumb --sbtype sbpro2 --exe "COMPOSD.EXE /SC: /IC:"`.
  With the preset's EMS and XMS it stops at once ("Not enough extended memory to run this
  program!!!"), and on the preset's SB16 it plays almost silently (vetter and skeptic). Start: Enter, ready
  `{ "stdout": "Press any key to go on" }`. 640x400 (80x50 text). With a .669 brought in (DosKit's
  Files panel takes .669 into C:), F11 lists it, Enter loads it, F5 plays it at a steady tempo,
  Alt+F5 tracks it; F12 saves, shown by the saved file's later timestamp [skeptic]; Alt+X, then Y,
  quits to DOS. Flashing 0.
- **Skeptic**: confirmed with corrections.
- **Caveats**: silent until a visitor brings in a .669. Browsers and operating systems may take F11
  and F12, but DosKit's on-screen keyboard has both [skeptic]. Alt+F4 and Ctrl+F4 (its message keys)
  close the window or tab on Windows, and Ctrl+N opens a window [skeptic]. The plain arrow keys act as
  keypad keys and change the sample; that Shift with them moves the cursor is [vetter only].

#### 4.2 Timeless (`tran-timeless`), triage rank 3

- **By**: Tran (Thomas Pytel), alone, except for the Sound Blaster driver by Dave (White Shadow).
- **Year**: 1994 ("a demo in Feb 1994"; files of 25 and 26 February 1994).
- **Party**: none.
- **Terms**: TIMELESS.DOC: "You may distribute and use this demo in any manner you wish, as long as all
  the original files, unmodified, are included with it." Tran never uses the word freeware, so do
  not label it so [skeptic].
- **Archive**: <https://files.scene.org/get/mirrors/hornet/demos/1994/t/timeless.zip>, 156,741 bytes,
  MD5 `ead1241b3e40b7a379024ebb3d04f0e2`, as is (scene.org's artists/tran copy and the IA's are the
  same file).
- **Runs**: `--preset demo --gus --exe "TIMELESS.EXE /S343 /L1"`. No start keys: its documented /S343
  picks the GUS at port 240, IRQ 5, and /L1 plays one pass. 320x200, with a 640x350 end picture;
  GUS; flashing at most 2 a second. It returns to DOS after one pass, at about 201 s, or about 214 s
  when its end screen fades and holds at half speed, which happened in one run of two [skeptic].
- **Skeptic**: confirmed with corrections. Drop the proposed hint, since /S343 skips the menu.
- **Caveats**: its end picture shows two nude female figures, in greyscale. Its /E switch skips the
  end screen but changes how the release ends: the maintainer's call. Without /L it loops until
  Escape.

### Shelf 5. Iguana and VangeliSTeam: 6 productions, 1,270,046 bytes

The Madrid groups of Jare, JCAB and COI. Iguana's RELEASES.TXT (24 August 1994, in its Heartquake
archives): "All these productions (except where noted by "COMMERCIAL") are public domain and can be
distributed freely, as long as no fee is charged (except the normal fee for public
domain/shareware collections). This worldwide, non-exclusive distribution license is granted to
everyone, except when stated otherwise in the package." Its table names Fire, Iris, The Globe,
Inconexia, BlasterSound #2 and Heartquake; Pump (1995) is not on it and has its own terms. DosKit does
not ship `heartq.zip`, so their README entries must give its source, size and MD5 (Hornet's copy,
<https://files.scene.org/get/mirrors/hornet/demos/1994/h/heartq.zip>, 1,835,825 bytes, MD5
`7c7a3e7541359445bed218f3cf473a39`) [skeptic]. Heartquake (shelf 2) belongs here too.

#### 5.1 Fire Demo (`vangelisteam-fire`), triage rank 29

- **By**: code Jare (Javier Arévalo) of VangeliSTeam; music "Elysium" by Jester (Volker Tripp) of
  Sanity, a 1991 Amiga module; player ShellVT, from VangeliSTracker 1.2b.
- **Year**: 1993 ("9-10/5/93").
- **Party**: none.
- **Terms**: RELEASES.TXT: "firedemo.arj │ 129395 │ 5/93 │ Fire demo by Iguana/VangeliSTeam + src",
  under the grant above. FIRE.NFO: "VangeliSTracker is Freeware (no money required), and distributed
  in source code". The music is not Iguana's to grant. Jester's 1996 Readme.txt (Aminet,
  mods/sets/JesterMods.lha) allows copying the modules "for your own private use" and asks his
  written consent of public-domain and shareware producers; since 2010 The Mod Archive (module 40475) has listed Elysium under CC BY-NC-SA with Jester as its registered artist, very probably
  his own choice, though no statement in his words says so [skeptic; the vetter had found no terms
  for the music]. Under that licence DosKit must credit Jester, link the licence, stay
  non-commercial and add no restrictions.
- **Archive**: <https://files.scene.org/get/mirrors/hornet/demos/1993/f/firedemo.zip>, 146,527 bytes,
  MD5 `28b1752cb81a61b18d84dc940babc542`, as is. It is Hornet's Unix repack of the lost
  `firedemo.arj`, with three BBS add-ons (buster.txt, coucou.exe, starprt2.exe) and a FIRE.CFG of
  June 1993. Its ELYSIUM.MOD is a different save of the tune from Jester's and Modland's copies
  [skeptic].
- **Runs**: `--preset demo --exe RUNDEMO.EXE --keys "2:N, 2.6:8, 3.2:N, 3.8:8, 4.4:N"`. Start: N, 8,
  N, 8, N (the Sound Blaster Pro/16 DMA stereo driver at 22 kHz), which needs a digit key name; or
  no keys, with the autoexec running `SHELLVT.EXE /d:DMA-SB-Stereo /f:22000 /v:63 /hq * /sh:Fire.Exe`,
  the command RUNDEMO builds from those answers [vetter only]. Ready: frames of RUNDEMO's first
  question (two cursor fingerprints). SB16; 320x200 (80x50 blocks) at about 66 frames a second; music
  throughout; flashing at most 1 a second. Any key shows its credits and returns to DOS.
- **Skeptic**: confirmed with corrections (including DosKit's own key timing).
- **Caveats**: the music's licence; its terms are not in its own archive; it never ends without a
  key; DOSBox logs "DSP:Unhandled (undocumented) command 45" every 40 ms, harmlessly; kind `effect`
  against pouet's and Demozoo's "demo".

#### 5.2 Iris (`jare-iris`), triage rank 35

- **By**: Jare of VangeliSTeam.
- **Year**: 1993 ("IRIS was coded bye Jare of VangeliSTeam, 12/5/93").
- **Party**: none.
- **Terms**: RELEASES.TXT: "vtiris.arj │ 9772 │ 5/93 │ Plasma demo by Iguana/VangeliSTeam + src",
  under the grant above. VT.NFO: "Please, spread this program everywhere."
- **Archive**: <https://files.scene.org/get/demos/compilations/lost_found_and_more/iris.zip>, 12,665
  bytes, MD5 `160b34a37a3ccf84daf7fe0c1149d46e`, as is. scene.org's lost_found collection made it in
  or after February 2015 (scene.org dates the file 26 June 2022 [skeptic]). Its BIG/ folder is byte
  for byte the six files of x2ftp's `vtiris.lzh`; its top-level IRIS.EXE is a later build by an
  unknown hand (September 1993) that prints "Cool message goes here".
- **Runs**: `--preset demo --pre "cd BIG" --exe IRIS.EXE`, so as to run the 1993 release. No start
  keys. A 320x200 plasma at 70 frames a second; no sound, by design. Any key shows its credits screen
  and returns to DOS in 0.2 s. `flashing: true`: the estimate passes 3 a second (at most 4) in three
  stretches of 1 to 3.6 s, at roughly 57 s, 107 to 111 s and 129 to 132 s, whose times drift by 1 to
  2.5 s from run to run [skeptic].
- **Skeptic**: confirmed with corrections. DosKit's end lines scroll its credits screen up by exactly
  one line [skeptic].
- **Caveats**: the first DosKit app whose autoexec needs `cd`; kind `effect` against pouet's and
  Demozoo's "4k intro".

#### 5.3 The Globe (`vangelisteam-globe`), triage rank 26

- **By**: Jare of VangeliSTeam; the idea, and the 1989 Atari ST original, by Axel of XXX
  International.
- **Year**: 1993 (coded "29/5/93"; its sources are dated 29 to 31 May 1993).
- **Party**: none.
- **Terms**: GLOBE.NFO: "Do anything you want with this source, but NEVER say it's yours. That would be
  a lie, so there you are. If you use it please DO credit me. If you use the idea then DO must credit
  Axel." RELEASES.TXT: "vtglobe.arj │ 21891 │ 5/93 │ Globe demo by Iguana/VangeliSTeam + src", under
  the grant above.
- **Archive**: <https://files.scene.org/get/mirrors/hornet/code/effects/globe/vtglobe.zip>, 22,074 bytes,
  MD5 `eba3bfb32dda7cb7319cbcd0ee434d4b`, as is (scene.org's lost_found copy and hornet.org's are the
  same file). It is a repack of `vtglobe.arj`, made on Unix with every file dated 9 July 1993; who
  repacked it is not recorded [skeptic].
- **Runs**: `--preset demo --exe GLOBE.EXE`. No start keys, and DosKit must send none: any key stops
  its cycle and hands the globe to the keyboard. 320x200 at about 70 frames a second; no sound;
  flashing 0; 18 dot figures in a loop of about 191 s. Escape shows its greetings and returns to DOS.
- **Skeptic**: confirmed with corrections. A description that says "1989" would fail DosKit's year
  test [skeptic].
- **Caveats**: kind `intro` (the author, pouet, Demozoo) or `effect`.

#### 5.4 Inconexia (`iguana-inconexia`), triage rank 22

The first try ran badly on DosKit's preset; the second try found settings that work and supersedes
it.

- **By**: Iguana/VangeliSTeam: code JCAB (the DemoVT player and four parts), Jare (setup and four
  parts) and ARM (the Museum); graphics COI; music COI (the Museum) and Thryxxon (the closing
  credits); fonts and ideas ReD Devil. INCONEXI.NFO credits the main tune to "303 Acid Factory";
  Iguana's 1995 Pump NFO says it "fue compuesto y es propiedad de DJ/Batman Group (Amiga)": composed
  by, and the property of, DJ of Batman Group.
- **Year**: 1993 (INCONEXI.NFO is signed 13 August 1993; this archive is the October 1993 update,
  with GUS and PAS support).
- **Party**: Assembly '93 (30 July to 1 August 1993, Kerava, Finland [skeptic]), PC demo competition:
  not shown, because a VGA mode-setting bug failed on the competition machine.
- **Terms**: its setup screen (INCONEXI.001): "IGUANA presents its latest production. It can be
  distributed in any way you wish." RELEASES.TXT (in `incosrc.zip` and `heartq.zip`): "inconexi.arj
  │ 479791 │ 8/93 │ Inconexia trackmo; now also with GUS!", under the grant above. INCOSRC.DOC:
  "303 Acid Factory asked us not to spread his (great) MOD alone". By Iguana's own 1995 account the
  main tune's owner never licensed it [skeptic].
- **Archive**: <https://files.scene.org/get/mirrors/hornet/demos/1993/i/inconexi.zip>, 479,845 bytes,
  MD5 `94ea1ab74f133a4012af13d22d90323c`, as is (the IA's copy is the same file). It is a Unix repack,
  every file dated 20 October 1993. Iguana's home BBS copy keeps the original DOS dates but ships a
  preset configuration, so this one stays the better choice [skeptic].
- **Runs**: `--preset demo --sbtype sbpro2 --machine vgaonly --exe INCONEXI.EXE` (second try). Start:
  Enter at its setup, whose default, "Plain SoundBlaster" at 16000 Hz, uses the same driver as Mono
  Sound Blaster Pro [skeptic: the wording], ready `{ "frames": [476243581] }` (720x400 on vgaonly). On
  the preset as it is, it hangs: with the SB16 the music stops and the Museum part waits forever, and
  with the GUS the first part hangs. On the SB Pro 2 every part played in order with sound. On
  svga_s3 the greetings scroller is garbled; on vgaonly it is right. Its parts show at 640x400 on
  vgaonly. A key during the closing credits returns to DOS cleanly [skeptic]. About 9:45 by an
  estimate (a DOSBox capture runs 610 s); it was never watched whole in one run. Flashing: the
  estimate gives 17 to 18 a second for about 60 s, from about 27 s into the scroller to its end
  [skeptic: longer than the second try's 50.5 to 66.1 s]; `flashing: true` is defensible.
- **Skeptic**: confirmed with corrections.
- **Caveats**: DosKit's first app off the Sound Blaster 16. Any key skips a part, and Escape at the
  setup's main menu quits to DOS. Credit the main tune with Iguana's correction. Watch it whole once
  before shipping.

#### 5.5 BlasterSound BBS Intro #2 (`iguana-blastersound2`), triage rank 23

- **By**: Iguana: design and text writer Jare; snowfaller and music player JCAB; tune COI; font by an
  unknown artist.
- **Year**: 1994 (BLASTER2.NFO: "Written by Iguana in 1994."; the files inside its two ARJs are dated
  13 February 1994; Iguana's lists say "2/94"). pouet's and Demozoo's August 1993 comes from the
  first BlasterSound intro's NFO, which pouet attached to this production [skeptic].
- **Party**: none; it advertises BlasterSound BBS in Granada, Iguana's home BBS.
- **Terms**: RELEASES.TXT in `heartq.zip`: "blaster2.arj │ 49847 │ 2/94 │ Second official Blastersound
  intro + src.", under the grant above (this archive's own RELEASES.TXT has only the table).
  BLASTER2.NFO: "Full source code is included, so you can learn a little. If you like it and/or use
  the concept, please credit us."
- **Archive**: <https://files.scene.org/get/mirrors/hornet/demos/1994/b/blaster2.zip>, 49,843 bytes, MD5
  `e22a8a6c2db6c2a9d412723d8a4a77d4`, as is (the IA's copy is the same file). It is a repack, made on
  Unix, of Iguana's `blaster2.arj`; who made it and when is not recorded [skeptic].
- **Runs**: `--preset demo --exe BLASTER2.EXE`. No start keys, and DosKit must send none: any key ends
  it. 640x480 in 16 colours; AdLib music (the General MIDI copy it also sends is silent in js-dos);
  flashing 0; its text loops every 41.6 s [skeptic]. Snow fills the screen in about 9.5 minutes (an
  estimate). A key prints Iguana's BBS advert and returns to DOS.
- **Skeptic**: confirmed with corrections.
- **Caveats**: none beyond citing `heartq.zip` for its terms.

#### 5.6 Pump (`iguana-pump`), triage rank 6

- **By**: Iguana: code Jare, Yann and Captain Bit; music Noisy Man; graphics Kronos, COI and Iñaki (3D
  models); DemoVT music system by JCAB; PMODE/W by Tran and Daredevil. It also belongs to shelf 7.
- **Year**: 1995 (PUMP.NFO is signed "Madrid, October 25th of 1995").
- **Party**: Euskal Party 1995 (Euskal 3, 12 to 15 October 1995, Tolosa, Gipuzkoa), PC demo
  competition: 1st, with 715 points. Its NFO says the low-level code was written before the party and
  the demo put together and synchronised there [skeptic].
- **Terms**: PUMP.NFO: "Copyright (C) 1995 by the authors. All rights reserverd. This software can be
  freely distributed by anybody in unmodified form."
- **Archive**: <https://files.scene.org/get/parties/1995/euskal95/demo/pump.zip>, 559,092 bytes, MD5
  `60ad353189b18a6bd22607036cbba92d`, as is. (The IA's item holds a different copy, `ign_pump.zip`
  [skeptic].)
- **Runs**: `--preset demo --gus --pre "SET WINDIR=KK" --exe PUMP.EXE --keys "4.5:Enter"`. Start: Enter
  ("Run the demo"; the GUS is chosen from ULTRASND), ready `{ "frames": [677580526] }`. SET WINDIR=KK
  is required, the README's own fix for Windows: without it the demo runs at about 0.44 times its
  speed. GUS; 320x200; it returns to DOS by itself at about 131.5 s, and part by part it matches a
  real 486DX2-66 with a GUS within 2 s [skeptic]. `flashing: true`: for about 14 s its greetings swap
  the whole screen between black and white five or more times a second.
- **Skeptic**: confirmed with corrections.
- **Caveats**: the flashing; its Sound Blaster path is untested [vetter only].

### Shelf 6. Assembly '95 podium: 2 demos, 3,591,983 bytes

Assembly '95's 1st and 3rd places. Its 2nd, Juice, is in section 4. Stars has no terms and shows
nudity; DX Project is the largest single archive before shelf 11. Neither was watched to its end.

#### 6.1 Stars: Wonders of the World (`stars-nooon`), triage rank 39

- **By**: NoooN: Karl (system, special effects), Barti (3D) and Ra (script, graphics); music Groo;
  sound replay LCA; PMODE by Tran.
- **Year**: 1995. This is the final release: STARS.EXE and STARS.NFO are dated 26 September 1995,
  FILE_ID.DIZ ("FINAL RELEASE") 17 September 1995.
- **Party**: Assembly '95 (Helsinki Fair Centre, 10 to 13 August 1995), PC demo competition: 1st, with
  3,646 points, ahead of Juice and DX Project.
- **Terms**: none found. STARS.NFO only says: "You should be able to find our releases for free on the
  following sites:" and "Your BBS must be demo-oriented and you should allow to any user to download
  all our productions for free(time&ratio)". Barti is active on pouet (last login 5 August 2026) and
  could be asked; Ra is banned there [skeptic].
- **Archive**: <https://files.scene.org/get/demos/groups/nooon/nooonstf.zip>, 1,164,723 bytes, MD5
  `d27c098862533229ae46c8542117fa4b`, as is (the IA's copy is the same file). Not the GUS-only party
  build or the 2014 and 2019 "v2" packages.
- **Runs**: `--preset demo --gus --exe STARS.EXE`. No start keys, and it ignores Space and Escape, so a
  visitor can neither skip nor quit it. 320x200; GUS; flashing at most 2 a second, and at most 3 over
  the whole real-hardware video. About 6:20 long; its last two minutes and whether it returns to DOS
  were not seen. Against a Pentium 120 + GUS capture its parts come within about 0.3 to 0.7 s while
  the host keeps up; on a heavily loaded host one run fell about 2 s behind at part loads
  [skeptic].
- **Skeptic**: confirmed with corrections.
- **Caveats**: nudity. Ra's cartoon pin-up is shown nude from behind (about 38 to 44 s) and from the
  front (about 51 to 57 s), and a warp of the picture runs from about 137 to 163 s; Demozoo tags it
  "nsfw", and pouet's screenshot is a three-frame animation including both nude frames [skeptic].
  Ra himself commented on pouet in 2010: "parental advisory : +21 years old." [skeptic]. Its share
  card must use another moment (about 95 s, the wasp). The id `stars` is taken by DosKit's VLA
  starfield; `stars-nooon` is free [skeptic]. The BARTi and KARL name cards swap order from run to
  run, apparently by the demo's own choice [skeptic]. Barti says the 1995 final lacks a 3D object
  that his 2014 "v2" adds [skeptic].

#### 6.2 DX Project (`dx-project-realtech`), triage rank 12

- **By**: Realtech (France). The end credits inside DX.EXE: code and design Execom (Stéphane Denis);
  graphics Guen (Romuald Genevois); 3D objects Toalnkor; textures Kyle (Mentasm); special guest
  musician Mindfuck of Mentasm; effects and module replay Otto Chrons; PMODE Tran [skeptic: the
  vetter's list missed Toalnkor's and the others' end credits].
- **Year**: 1995 (its files are dated 14 August 1995; FILE_ID.DIZ: "Official Release ... v1.01").
- **Party**: Assembly '95 (Helsinki Fair Centre), PC demo competition: 3rd, with 1,204 points.
- **Terms**: DX.NFO: "This demo is freeware." / "Distribute It Like Crazy on BBS, Internet and CDROM
  !" / "No money can be charged for it."
- **Archive**: <https://files.scene.org/get/parties/1995/assembly95/demo/dxproj.zip>, 2,427,260 bytes,
  MD5 `dbe87fa9af1311d9b8b14cf71bf904f4`, as is; Assembly's own archive links it as the "Original".
  Not the group folder's `rt_dxprj.zip` (2,430,362 bytes), which pouet links: it adds PARAZITE.COM, a
  BBS advert.
- **Runs**: `--preset demo --gus --exe DX.EXE --keys "7:Down*5, 10:Enter" --hold 60 --gap 250`. Start:
  Down five times, then Enter, which reaches START DEMO although the selection never shows on screen;
  ready `{ "frames": [3448862884] }` (the menu at rest, measured with the GUS present). Keys sent on
  the first frame at rest, as DosKit sends them, worked [skeptic]. Keep svga_s3: it runs in 640x480
  through VESA. GUS; flashing at most 2 a second. Its galleon scene draws only 4 to 5 frames a second
  at 30000 cycles; faster cycles were not tried. About 6 minutes (captures of 372 and 347 s); its end
  was not seen.
- **Skeptic**: confirmed with corrections. DX.EXE holds several music modules (realtech, mindkick,
  oldx, epilog), not one [skeptic]. A mouse moved over the player before the menu rests changes the
  fingerprint, so DosKit would wait 45 s and then show the hint.
- **Caveats**: a start of six keys, sent once; the galleon's frame rate.

### Shelf 7. Party winners beyond Assembly: 3 demos, 3,467,445 bytes

The winners of The Party '93, The Gathering '95 and Wired '95, beside DosKit's Crystal Dream 2, the
winner of The Computer Crossroads '93. Pump (shelf 5), the Euskal '95 winner, belongs here too;
X14 and Crystal Dream are in section 4.

#### 7.1 Untitled (`untitled-dust`), triage rank 7

- **By**: Dust (Troisdorf, Germany): code Stone; graphics Tyrone, Vioon and Den; music B-Man.
- **Year**: 1994. This is the bugfixed final release, its files dated 29 to 31 January 1994
  (FILE_ID.DIZ: "Bugfixed-Release 2/1/1994"); the GUS-only party version is from December 1993.
- **Party**: The Party 1993 (27 to 29 December 1993, Herning Messecenter, Herning, Denmark), PC demo
  competition: 1st.
- **Terms**: UNTITLED.NFO: "This demonstration is FREEWARE. You are allowed to copy and distribute it as
  long as no changes are made to it. You may NOT SELL it or charge anything for copying it.
  Generally, any kind of commercial reproduction without our permission is strictly forbidden !
  Please contact us, if you would like to do the above." The exit screen's own wording cannot be
  read from the packed files (the vetter took it from a third-party video), so do not quote it as
  the archive's [skeptic].
- **Archive**: <https://files.scene.org/get/parties/1993/theparty93/demo/dust_unt.zip>, 858,590 bytes,
  MD5 `151d5294cc8da6df2f2cf971c1cebe39`, as is (the IA's copy is the same file). Avoid the party
  version: it is GUS-only, and its ZIP comment is a US BBS's boilerplate calling copying "expressly
  forbidden by Federal Law" [skeptic].
- **Runs**: `--preset demo --gus --exe "UNTITLED.EXE /NS"`. Its NFO's /NS switch skips the setup and
  needs no keys; the skeptic prefers it, because DosKit does not capture the mouse and the setup's
  Enter only works while its own pointer rests on "start". The alternative is Enter at the setup,
  ready `{ "frames": [2207668977] }`. GUS (the setup's autodetect picks it, inferred from the absence
  of Sound Blaster activity in the log [skeptic]); 320x200. About 5:15 by a 70 Hz capture; its last
  ~75 s (a landscape, the credits, the exit to DOS) were not seen in emulation. Flashing: under a
  second at its interference rings, 6 to 8 a second in one quarter of the picture; look at it by eye
  before setting `flashing: false` [skeptic].
- **Skeptic**: confirmed with corrections.
- **Caveats**: the rings; pouet's only screenshot is of a part past 240 s.

#### 7.2 Dope (`complex-dope`), not shortlisted

The triage deferred it for its missing terms ("Ask Complex"); it was vetted anyway.

- **By**: Complex (now Komplex): code jmagic; graphics and music jugi; boxes and the Media Labs logo
  reward; 3D objects jugi and M. Hakulinen; replay routine phantom of Sonic PC.
- **Year**: 1995 (DOPE.EXE is dated 15 April 1995).
- **Party**: The Gathering 1995 (11 to 15 April 1995, Stavanger, Norway [skeptic]), PC demo
  competition: 1st.
- **Terms**: none found in DOPE.TXT, FILE_ID.DIZ, the comment or komplex.org. Complex offered a ZIP
  with the same four files on its own site; the link is dead and survives in the Wayback Machine
  [skeptic]. komplex.org: "non-interactive multimedia demonstrations written in unearthly
  programming languages. download, unzip and run in dos platform." DOPE.TXT says one 3D model, the
  cat, was "found from some cdrom...".
- **Archive**: <https://files.scene.org/get/parties/1995/thegathering95/demo/clx_dope.zip>, 912,779
  bytes, MD5 `0e6077bb1cc684c4135987e773d15c7c`, as is. scene.org's group-folder copy (910,933
  bytes) adds scene.org's notice, and Complex's own (909,475 bytes) is only in the Wayback Machine.
  This is the final release of 15 April; the competition version is a separate
  `dope-party-version.zip` (939,650 bytes) [skeptic].
- **Runs**: `--preset demo --gus --cycles max --exe DOPE.EXE`. No start keys; GUS only (without one it
  stops at a prompt for the GUS port [vetter only]). 320x200; flashing at most 1 a second in the 240
  s seen (its second half was not measured). About 7.7 minutes; its end was not seen. At 30000 cycles
  its later parts fall behind a Pentium III + GUS capture (about 2 to 4 s by 145 s [skeptic]; 5 to 10
  s later on [vetter only]); at max cycles they keep pace within a few seconds. That a key quits it
  cleanly to DOS is [vetter only].
- **Skeptic**: confirmed with corrections.
- **Caveats**: no terms; max cycles depends on the visitor's device.

#### 7.3 Solstice (`solstice-valhalla`), triage rank 19

- **By**: Valhalla (UK): code Sandman; music Big Jim; graphics Sandman, Vision FX and Dambuster;
  design and ideas Sandman, Big Jim, Hollywood, Dambuster and Vision FX.
- **Year**: 1995 (README.TXT: "Released 15-11-1995").
- **Party**: Wired 1995 (3 to 5 November 1995, University of Mons-Hainaut, Mons, Belgium), PC demo
  competition: 1st, with 590 points.
- **Terms**: README.TXT: "Solstice is public domain, this means that you can freely give the COMPLETE
  version of this demo to any of your friends etc. as long as no charge is made." / "Any other
  commercial establishments using this product must contact us before use. This also includes CDRom
  distrubution, if you wish to put this on your CDRom, you MUST contact us first!"
- **Archive**: <https://files.scene.org/get/demos/groups/valhalla/solstice.zip>, 1,696,076 bytes, MD5
  `d579969e03393a987ce9a8fbf5b66750`, as is (the IA's copy is the same file). The fixed build of
  January 1996 in the party folder is a separate release made for a PC Format CD.
- **Runs**: `--preset demo --gus --exe SOLSTICE.EXE --keys "1.5:Enter*3"`. Start: Enter three times at
  its MIDAS setup (GUS, port 240h, 16-bit stereo), ready `{ "frames": [1313454887] }`; keys sent
  about 0.3 s after the screen appeared took [skeptic]. GUS; 320x200, with 640x400 hi-colour parts;
  flashing at most 2 a second. About 3.5 minutes (210.5 s [skeptic]); it returns to DOS by itself.
- **Skeptic**: confirmed with corrections. Its hi-colour parts build colour from rows of pure red,
  green and blue, in that order from the top [skeptic; the vetter said blue, red, green].
- **Caveats**: those rows show as stripes on a flat screen, where a CRT blended them. Its end screen
  gives the members' 1995 addresses and phone numbers. One sample name in its music has a rude line,
  visible only in a tracker.

### Shelf 8. Type One of TFL-TDV: 2 productions, 952,558 bytes

Both under licences their main coder, Laurent Lardinois (Type One), published in 2022: MIT with
two zlib-style clauses (GitHub classes them as "Other"). Their notices must be shown beside the
archives, since the 1994 ZIPs cannot hold them unchanged. Both ZIPs also carry PA.BBS, a text
banner for the Pleasure Access BBS that is mostly a picture of a nude woman; neither program shows
it, but a visitor at the DOS prompt afterwards could print it [skeptic for Kukoo2; this report for
Contrast, whose PA.BBS is the same file with three lines of BBS details changed].

#### 8.1 Kukoo2 (`typeone-kukoo2`), triage rank 21

- **By**: Type One (Laurent Lardinois) of The FLamoots (TFL-TDV); pre-intro idea and graphics Fred;
  music "Crooner" by Drax (Thomas Mogensen), converted by JCH of Vibrants; AdLib player by JCH;
  interface by Patch of Avalanche; font by Witan.
- **Year**: 1994. This is version 2.43 "short" of 28 March 1994; it was first released in January 1994.
- **Party**: none; it advertises the Pleasure Access BBS in Brussels.
- **Terms**: none in the ZIP. The author's LICENSE (github.com/type-one/t1-1994-kukoo2, 2022): "MIT
  License / Copyright (c) 1993-2022 Laurent Lardinois aka Type One / TFL-TDV", with "3. The above
  copyright notice and this permission notice shall be included in all copies or substantial
  portions of the Software." The licence names the repository's v43 source and its 2022 rebuild;
  reading it as covering this 1994 binary is reasonable, and the author, who is active, could
  confirm. It cannot cover JCH's player, Drax's tune or Witan's font; the intro itself says
  "VIBRANTS (sorry for ripping your rout !!!)".
- **Archive**: <https://files.scene.org/get/mirrors/hornet/demos/1994/k/kukoo2.zip>, 29,395 bytes, MD5
  `045ba92ac55382f8f8f0f0e84c66a1cc`, as is. This "short" build has none of the crude and racist 1990
  lines that the "large" build in `kuk2src.zip`, which pouet links, and the MIT-licensed repository's
  source carry [skeptic for the repository].
- **Runs**: `--preset demo --machine vgaonly --exe KUKOO2.EXE --keys "14:Space, 130:Escape, 145:Space"`.
  Start: Space at the end of its CGA pre-intro, ready `{ "frames": [3835576239] }` or
  `{ "stdout": "PLEZIER ACCESS BBS" }`; a press at DosKit's own timing took [skeptic]. vgaonly is
  required: on svga_s3 its VGA part is garbled [vetter only; the author's README says the same].
  AdLib music through the SB16's OPL, and the Belgian anthem on the PC speaker in the pre-intro;
  its VGA part shows at 792x558; flashing at most 1 a second. It loops until a key; Space or Escape
  twice returns to DOS.
- **Skeptic**: confirmed with corrections. The vetter's caveat about jitter in its lower half is
  wrong: mainline DOSBox (r4134) and js-dos's own DOSBox fork carry the fix, commented "Kukoo2 demo"
  [skeptic].
- **Caveats**: PA.BBS (above). Its exit text gives the author's 1994 postal address.

#### 8.2 Contrast (`tfltdv-contrast`), triage rank 30

- **By**: TFL-TDV (The Flamoots & The Dark Vision): Type One (the VGA framework and most parts),
  Morflame (the Wolfenstein part), Bismarck (shadelines, the Star Wars scroller), Sam (setup,
  sprites), Gopi (dots morph) and Karma (the eyes effect; Demozoo credits him with an "end plasma"
  [skeptic]); graphics Zoltan, Fred, Type One and Youvi; music Fred ("Magic Fred"); end ANSI Green
  Kawa.
- **Year**: 1994. This is the fixed release after the party, with files of 1 to 20 November 1994.
- **Party**: Wired '94 (29 to 31 October 1994, Mons, Belgium), PC demo competition: 2nd, with 172
  points.
- **Terms**: the archive states none. TFL-TDV.NFO: "If you have the privilege to be a TFL-TDV HQ or
  Dist, you absolutely have to create a "The FLamoots-The Dark Vision" area with all our files free
  !!!!!" Type One's LICENSE (github.com/type-one/t1-1994-contrast, 2022), MIT with zlib-style
  clauses; the repository links this exact ZIP. The MIDAS Sound System licence, section 3:
  "Programs using MIDAS Sound System may always be freely distributed if no fee is charged for the
  distribution and may freely be used by anyone. The Program and its documentation must clearly
  state that the program uses MIDAS Sound System and that it may freely be used and distributed
  under the terms of this Section 3." TECH.DOC states only the first half [skeptic].
- **Archive**: <https://files.scene.org/get/mirrors/hornet/demos/1994/c/contrast.zip>, 923,163 bytes,
  MD5 `80613f3380aded2cf9d1158468f5f8fc`, as is (the IA's copy is the same file).
- **Runs**: `--preset demo --machine vgaonly --gus --exe CONTRAST.EXE`. No start keys; MIDAS finds the
  GUS. vgaonly keeps its end screen's raster gradient (lost on svga_s3 [vetter only]). 320x200 and
  320x400 (shown at 640x400) parts and an 80x50 end screen. `flashing: true`: its multi-fire part
  alternates frames at up to 35 a second, and its sine distorter passes 3 a second. About 9.5
  minutes, by an estimate. It ends on a Pleasure Access BBS screen built into the program, which
  waits for Space or Escape; then it returns to DOS.
- **Skeptic**: confirmed with corrections. That end screen is built in (pa2.inc), not PA.BBS. PA.BBS,
  the NFO and the module are byte for byte the repository's [skeptic].
- **Caveats**: third-party material no member can license: its opening image of Gaston Lagaffe
  (Franquin's character), which TECH.DOC's "GFX ripped from Ultimate GFA demo/OVR - Atari ST" refers
  to [skeptic], Doom's Cacodemon sprite, a scan of the cartoonist Frédéric Jannin, samples from
  "Primal Urge", an eyes scan from the Deluxe Paint IIe pack, and a font of unknown origin [skeptic].
  Its 70 Hz alternate-frame effects shimmer on 60 Hz screens. Parts 10 to 17 were
  not seen by the skeptic. LOOK_ME.GIF and the end text show the members' 1994 photos and addresses.
  PA.BBS (above).

### Shelf 9. Future Crew, part 2: a slideshow, a diskmag and two musicdisks, 4,226,762 bytes

These complete the roadmap's Future Crew shelf (about 6.1 MB with shelf 1, as the triage put it).
They need digit key names (Slideshow I), a new `diskmag` kind (Worldcharts), a new `musicdisk`
kind (Journey, Chaotic Mind), and a decision on ROADMAP's "Not planned: A module player, MIDI,
audio or video recording". The triage read that line as being about a player built into DosKit,
not about Future Crew's own disks.

#### 9.1 Slideshow I (`fc-slideshow1`), triage rank 34

- **By**: Future Crew. Demozoo: Psi code, BIG music, Hal and Jpm graphics. One picture is, by its own
  caption, Hal's PC version of an Amiga picture by DeathStar.
- **Year**: 1990 (files of 26 to 28 June 1990; FC's list says 7-23-90; FCINFO17: "In the year 1990
  there was only one demo release from us, the Slideshow I").
- **Party**: none.
- **Terms**: none in the archive. FCINFO17 section 3, and its list: "FC-SLIDE.ZIP 350 kb 7-23-90
  Slideshow I, a graphics collection, SB". FCINFO10 and 12 forbid commercial use without permission
  [skeptic].
- **Archive**: <https://files.scene.org/get/demos/groups/future_crew/grfx/fcslide1.zip>, 344,681 bytes,
  MD5 `680d177f28c0e8612dc90f8137317f8d`, as is (the IA's copy is the same file).
- **Runs**: `--preset demo --exe FCSLIDE1.EXE`. Start: 9 (Sound Blaster on a 12 MHz or faster AT),
  which needs a digit key name; ready `{ "stdout": "9 - Sound Blaster with 12Mhz or faster AT." }`.
  SB16; 320x200; flashing 0. Nine pictures, one for each key press (any key but Escape) once a
  picture has faded in; keys during a change of about 2.2 s are dropped. It loops after the ninth;
  Escape returns to DOS. Its music is driven by the timer and sounds the same at 10000 cycles
  [vetter only].
- **Skeptic**: confirmed with corrections. The "WAIT" sign the vetter's hint relied on is 13 by 4
  pixels and shows for about 0.3 s; say instead "press Space once the picture has faded in"
  [skeptic].
- **Caveats**: the visitor drives it; kind `demo` (the authors' word) or a new `slideshow` (pouet's
  and Demozoo's).

#### 9.2 Worldcharts #1 (`fc-worldcharts1`), triage rank 37

- **By**: Future Crew: main editor GORE, coder Psi, graphics Pixel, music Purple Motion and C.C.Catch;
  articles and reviews by Future Crew members and outside writers.
- **Year**: 1993. FILE_ID.DIZ: "Released May 26th, 1993"; FC's lists say 6-26-93; Demozoo 26 June
  1993; pouet May 1993.
- **Party**: none; Future Crew's only Worldcharts issue.
- **Terms**: none in the archive. FCINFO17 section 3 ("All our demos and programs"; FCINFO10 and 12
  say only "demos", which a diskmag arguably is not [skeptic]), and its list: "WCHARTS.ZIP 680 kb
  6-26-93 Worldcharts magazine issue #1, SB/SBp/GUS".
- **Archive**: <https://files.scene.org/get/demos/groups/future_crew/other/wcharts.zip>, 613,568 bytes,
  MD5 `0c34047bfbdbd6af1c8de63c467b9b7d`, as is. The Hornet and IA copies are a later Unix rezip.
- **Runs**: `--preset demo --machine vgaonly --gus --exe WCHARTS.EXE`. No start keys: its main menu is
  up at about 2.3 s (`{ "frames": [1171078845] }` if a signal is ever wanted). GUS music, changed
  with F1 to F4. vgaonly is needed: on svga_s3 half its 16 colours show as pure lime [vetter only; a
  pouet comment reports wrong colours in DOSBox too]. Flashing at most 1 a second. Its Exit button,
  or Escape on its main menu, shows an ANSI end screen and returns to DOS.
- **Skeptic**: confirmed with corrections. The proposed hint would never show; a single Escape on the
  main menu quits at once; clicking is untested, since the harness has no mouse; Alt+X could not be
  confirmed [skeptic].
- **Caveats**: the new `diskmag` kind. Its voting form and end screen ask for votes at 1993 addresses;
  Future Crew stopped the magazine after this issue.

#### 9.3 Journey 1 and 2 (`fc-journey`), triage rank 33

- **By**: Future Crew: music Purple Motion (Jonne Valtonen); MusicDiskPlayer V1.0, "Copyright (C) 1993
  Future Crew" (Demozoo credits Psi with its code).
- **Year**: 1993 (released 28 December 1993).
- **Party**: released at The Party 1993 (Herning, Denmark), in no competition.
- **Terms**: FCINFO12.TXT (version 1.21, inside both ZIPs), section 3, the text DosKit already quotes
  for StarPort; its list: "JOURNEY1.ZIP 867 kb 12-28-93 First Music Disc by Purple Motion" and
  "JOURNEY2.ZIP 1015 kb 12-28-93 Second Music Disc by Purple Motion". MDP.DOC: "You can freely use
  the MusicDiskPlayer to publish your own musics."
- **Archives**: <https://files.scene.org/get/mirrors/hornet/music/disks/1993/journey1.zip>, 839,556
  bytes, MD5 `4e364c15beea9961118c52ebb1546bf1`, and
  <https://files.scene.org/get/mirrors/hornet/music/disks/1993/journey2.zip>, 1,007,390 bytes, MD5
  `e3b7ca6d2b2aa271581ceee0151c5b1e`; both as is (the IA's copies are the same files). Not the
  group-folder copies, which add scene.org's notice and comment. The two parts' files clash in one
  directory, so this means two apps, or part 1 alone.
- **Runs**: `--preset demo --gus --exe MDP.EXE --keys "3:Enter"`. Start: Enter, which plays the
  highlighted first song; ready `{ "frames": [3767943100] }` for part 1, `[1738662686]` for part 2.
  GUS; a 512x480 menu and a 640x480 playing screen; Escape switches between them while the music
  goes on, Up, Down and Enter pick a song, F10 returns to DOS. A song loops until another is picked.
  Flashing 0.
- **Skeptic**: confirmed with corrections. The one quiet song is A Touch of Spring, whose module's
  master volume affects only the Sound Blaster; Cool City, also 16 channels in its header, played at
  full level, so "16-channel songs are quiet on the GUS" is wrong [skeptic].
- **Caveats**: DosKit's 4:3 view stretches the 512x480 menu by 25% (`renderAspect: "AsIs"` would keep
  both screens' proportions but change the canvas's shape between them). The sample texts of three
  songs carry Jonne Valtonen's 1993 address [skeptic]; two say some samples were "loaned" (from
  Rubicon, and from Outzider/Darkzone's Debut). An unexplained extra bar in one song's header
  [vetter only].

#### 9.4 Chaotic Mind (`fc-chaotic-mind`), triage rank 32

- **By**: Future Crew: music Skaven (Peter Hajba); MusicDiskPlayer V1.1 (Demozoo credits Psi with its
  code).
- **Year**: 1994 (20 February 1994).
- **Party**: none; Imphobia 9's chart (February 1995) voted it the second-best musicdisk.
- **Terms**: FCINFO13.TXT, inside the archive, section 3: "All our demos, except the ones which we have
  created for different companies, are freeware." / "This means that you can copy and distribute
  them freely as long as you make no modifications to them. Also, no money can be charged for
  copying them." It adds the PD/shareware/freeware contact request with its two weeks. Its list:
  "CHMIND.ZIP 1420 kb 02-20-94 Chaotic Mind - Music collection by Skaven". Skaven's own site (2002):
  "All the songs on this page are freeware. They may be freely distributed in unmodified form."
  [skeptic].
- **Archive**: Hornet's copy, <https://files.scene.org/get/mirrors/hornet/music/disks/1994/chmind.zip>,
  the same file as <https://archive.org/download/demoscene_ChaoticMind-FutureCrew/chmind.zip>:
  1,421,567 bytes, MD5 `f40cfcf5dd517fcdbe20d7cb03c6a324`, as is. The vetter could not download
  Hornet's; the skeptic could [skeptic]. The copy in Future Crew's scene.org folder (1,423,424 bytes)
  adds scene.org's notice and comment.
- **Runs**: `--preset demo --gus --exe MDP.EXE --keys "4:Enter"`. Start: Enter, which plays the first
  song, Amazonas; ready `{ "frames": [573231961] }`. GUS (the SB16 also works [vetter only]); a
  512x480 menu and a 640x480 playing screen; Escape, Up, Down and Enter as in Journey; F10 returns
  to DOS. Songs loop. Flashing 0.
- **Skeptic**: confirmed with corrections. Its playing screen does have outside captures, the IA's
  emulator's, and in about half of DosKit's frames it shows a full-width row of blocks along the top
  that those captures never show. Neither is real hardware; which is right is open [skeptic].
- **Caveats**: Skaven's 1994 address is in READ.ME and in one song's instrument names [skeptic].
  ID.S3M's notes say "70% of the samples have NOT been ripped!" [skeptic].

### Shelf 10. Trackers beyond IT and ST3: 3 programs, 2,550,232 bytes

FM, PC-speaker and OPL3 music beside DosKit's two sample trackers; Composer 669 (shelf 4) belongs
here too. Adlib Tracker II is ROADMAP item 4. With AT2's source hosted beside it, the shelf is
5,607,092 bytes. MONOTONE needs digit key names, and EdLib a change to the Files panel or no
import.

#### 10.1 EdLib 1.05a (`vibrants-edlib`), triage rank 8

- **By**: Jens-Christian Huus (JCH) of Vibrants. Its 27 example songs are by Drax (Thomas Mogensen),
  JO (Jesper Olsen), Metal (Torben Hansen), MSK (Morten Sigaard Kristensen) and JCH [skeptic].
- **Year**: 1994 (EDLIB.REV: "20/12-1994; Version 1.05a: First public release").
- **Party**: none.
- **Terms**: EDLIB.DOC (1994): "All files in this archive is freeware - if you payed for it, you have
  been cheated! However, I reserve the rights to maintain all copyrights. Do NOT reverse engineer my
  code or else! :(" and "All files in the archive should be distributed in their original form - it
  is forbidden to modify anything. The player may not be used commercially in any way without
  permission from the author." JCH's 2007 EDLIB.TXT keeps the second, drops the freeware wording,
  and recommends running EdLib in DOSBox [skeptic].
- **Archive**: two copies, both as is. Hornet's, which the vetter vetted:
  <https://files.scene.org/get/mirrors/hornet/music/programs/trackers/edlb105a.zip>, 132,238 bytes, MD5
  `e11ec1ba17fde58c2c1e69476e645fc7` (the IA's copy is the same file). Its FILE_ID.DIZ is JCH's own,
  with two lines added by the uploader MOTIV8 [skeptic; the vetter called it MOTIV8's], and MOTIV8
  added an advert, MOTIV8.COM. JCH's own, which the skeptic recommends:
  <https://chordian.net/files/programs/dos/EdLib_v1.05a.zip>, 124,525 bytes, MD5
  `9a6ff3082278da200ef50828350bd49c`, with the same program files and songs, his 2007 documents, and
  no DIZ or advert [skeptic].
- **Runs**: `--preset tracker --exe EDLIB.EXE`. Start: Escape, which closes its About box; ready
  `{ "frames": [1155236736] }`, the same with both copies [skeptic]. 640x400 (80x50 text); FM through
  the SB16's OPL. Ctrl+F3 or F12 lists SONGS\, Enter loads, F3 plays at real-time tempo. Flashing at
  most 1 a second.
- **Skeptic**: confirmed with corrections.
- **Caveats**: DosKit's Files panel takes no .EDL and puts files in C:\, while EdLib reads only
  SONGS\, so either teach the panel or leave importing out. Its only exit, Ctrl+Break, has no DosKit
  key name. Saving [vetter only].

#### 10.2 MONOTONE 0.3.9 (`trixter-monotone`), triage rank 31

- **By**: Trixter (Jim Leonard) of Hornet; intro ANSI by Spinsane of ACiD; example songs by virt and
  yesso; disk-writer fixes by Scali.
- **Year**: 2017 for this build (8 July 2017). The program dates from 2008.
- **Party**: Blockparty 2008, wild competition: 2nd, with a 2008 alpha, not this build.
- **Terms**: the ZIP states none. The author's repository, github.com/MobyGamer/MONOTONE, has been
  under the Unlicense since its first commit (31 October 2014): "This is free and unencumbered
  software released into the public domain." The tree of its 0.3.9 tag holds this exact
  MONOTONE.ZIP [skeptic].
- **Archive**: <https://github.com/MobyGamer/MONOTONE/releases/download/0.3.9/MONOTONE.ZIP>, 189,791
  bytes, MD5 `c2490476f82eb454fd2f60275e17e8ea`, as is; scene.org's Blockparty 2008 folder holds the
  same file. An untagged build of 2019 is on the repository's master branch [skeptic].
- **Runs**: `--preset tracker --exe MT.EXE --hold 60 --gap 250`. Start: 1, 0, 4, Enter, Space (generic
  colour display, PC speaker, four tracks, past the title screen), which need digit key names;
  ready `{ "stdout": "1. Color: Generic" }`. PC speaker; the AdLib with 7 in place of 0; the Tandy
  chip with 4 and `tandy: 'on'` [vetter only]. 40x25 colour text shown at 640x400. Ctrl+L, typing
  PRELUDE.MON and Enter loads a song; Ctrl+Shift+P plays it. Unless F2 shows the pattern editor, the
  song plays behind a still help screen [skeptic]. Escape, then Y, quits to DOS. Flashing 0.
- **Skeptic**: confirmed with corrections. In Firefox on Windows and Linux, Ctrl+Shift+P opens a
  private window and a page cannot stop it; suggest Ctrl+P, which plays from the cursor's order
  (untested) [skeptic].
- **Caveats**: Ctrl+W (its disk writer) closes the tab on Windows and Linux, so set
  `warnBeforeLeaving`. RICKROLL.MON is virt's 1-bit cover of a copyrighted song; use PRELUDE.MON
  (Bach) as the example. With the year 2017, keep 2008 out of the one-line description. Small text
  overlaps of its own (an alpha).

#### 10.3 Adlib Tracker II G3 2.3.58 (`adlib-tracker-2`), triage rank 18

- **By**: subz3ro of Altair (Demozoo also credits ijsf and Malfunction).
- **Year**: 2026 for this rebuild (2 June 2026). Version 2.3.58 first came out on 28 December 2024,
  and AT2 itself in 2000 (pouet, Demozoo).
- **Party**: none.
- **Terms**: the ZIP states none. The headers of its source (`at2_sourcecode_06-02-2026.zip`, 42 of the
  44 AT2 files outside sdl/ [skeptic]): "AT2 is free software: you can redistribute it and/or modify
  it under the terms of the GNU General Public License as published by the Free Software
  Foundation, either version 3 of the License, or (at your option) any later version." The author's
  FAQ: "Q: Is AT2 freeware? A: Yes, it can be freely used, shared, spread, whatever - as much as you
  like, and as long as it makes you having a good time. :-)" CWSDPMI r5, which it ships, may be
  passed on unmodified if users are told they can get its source, and where. Inquisition's timer
  unit, linked into its EXEs: "The source code is FREE FOR ANY NON COMMERCIAL USAGE." subz3ro's GitHub
  repository carries only a GPL-2.0 LICENSE; quote the headers.
- **Duties**: host the source ZIP (3,056,860 bytes, MD5 `88bdd34173c4aa7cf39fa27ceb909d57`), or link
  it clearly and keep it available as long as the binaries are served (GPLv3 section 6(d)); the
  author's site has gone offline before [skeptic]. Give the GPL text, which neither ZIP contains.
  Add a CWSDPMI source notice naming a site. Stay non-commercial.
- **Archive**: <https://adlibtracker.net/files/at2g3r58.zip>, 2,235,916 bytes, MD5
  `c1b428352378be1177fb93440aa3b41d`, as is; pouet's "dos port" link. The file was rebuilt under the
  same name before, so pin the MD5.
- **Runs**: `--preset tracker --memsize 32 --pre "cd AT2" --exe ADTRACK2.EXE`. With DOSBox's default 16
  MB it stops: "Insufficient extended memory!". No start keys; its 720x480 editor appears after about
  16 s at 18000 cycles, 14 of them on a still DOS screen (10 to 11 s at 30000, where playback was not
  checked). OPL3 FM. F3 opens the file browser, Enter loads a song, F5 plays it at real-time tempo.
  Flashing 0.
- **Skeptic**: confirmed with corrections. Its file browser hides 121 of the 501 bundled songs (every
  AMD, CFF, DFM, FMK and HSC file) although its masks include those formats: a defect of this build,
  cause unknown; a hint should name a folder that works, such as BEN, BRENDAN or NULA [skeptic]. Its
  song set includes covers of commercial music (its own downloads page names a Super Mario Bros.
  tune and a Kraftwerk song), which neither the GPL nor the FAQ can license [skeptic].
- **Caveats**: it is larger than any archive DosKit ships today (+29.0% on today's total, +68.6% with
  its source), though smaller than DX Project and the two demos of shelf 11. Its
  key repeat is very fast; keys sent during a load are lost; browsers keep F11, F12, Ctrl+T, Ctrl+N
  and Ctrl+W; a screen saver starts after 5 idle minutes. Whether CWSDPMI writes a swap file that
  `saveFiles` would keep is untested.

### Shelf 11. Assembly PC demo winners 1996-97: 2 demos, 8,536,243 bytes

The Assembly winners after 1995, both deferred by the triage for their size and speed and vetted
anyway. Together they would more than double DosKit's archives (+110.6%). Both need the GUS and
cycles `'max'`, and neither was watched to its end.

#### 11.1 Machines of Madness (`dubius-machines-of-madness`), not shortlisted

- **By**: Dubius: Tremor (Allan Perämäki), code, vector engine and music player; Nitro (Kai-Eerik
  Komppa), music; graphics Tonic (Jetro Lauha) and Lazur of Pulse (the party NFO credits Tonic
  alone; the demo's own credits and the later fix's NFO add Lazur); 3D Tremor, Nitro and Sol (Jari
  Komppa); PMODE/W by Tran and Daredevil.
- **Year**: 1996 (all its files are dated 16 August 1996).
- **Party**: Assembly '96 (16 to 18 August 1996, Helsinki Fair Centre, Pasila), PC demo competition:
  1st, with 1,452 points.
- **Terms**: MACHINES.NFO: "This material is not freeware. You are allowed to copy it without
  restrictions for non-commercial use." / "No payment of any kind may be charged for this product or
  any combination of products or services including this product without our authorization and
  official written license." It also forbids changes. Tonic's own site, jet.ro, links this exact
  archive as "Download DOS zip" [skeptic]. Do not label it freeware.
- **Archive**: <https://files.scene.org/get/parties/1996/assembly96/demo/machines.zip>, 3,895,410 bytes,
  MD5 `724c26bc53805a48991ca056cc629144`, as is (the IA's copy is the same file). Its later "SB Fix",
  `machifix.zip`, is a patch over it and is not needed.
- **Runs**: `--preset demo --gus --cycles max --exe MACHINES.EXE`. No start keys; it picks the GUS
  itself. This version's Sound Blaster mode stops with "EMS Error!" (vetter and skeptic). 320x200, a 640x480
  VESA title picture (keep svga_s3) and a 320x255 painting; flashing at most 2 a second. About 7
  minutes (421 s on real hardware); its last ~3 minutes and the return to DOS were not seen. Escape
  returns to DOS. At 30000 cycles it plays with about half the frames [vetter only].
- **Skeptic**: confirmed, with no corrections.
- **Caveats**: "not freeware" is the authors' word.

#### 11.2 Boost (`doomsday-boost`), not shortlisted

- **By**: Doomsday: code Doom (2D) and MRI (3D, misc); music Illusion and Swallow; art and scenes
  Damaq, Dice and Wode; 3D objects Axid of Gasp Inc.; MIDAS by Sahara Surfers; PMODE/W by T Pytel and
  C Scheffold.
- **Year**: 1997. This is the final version, with files of August and September 1997.
- **Party**: Assembly '97 (8 to 10 August 1997, Helsinki Fair Centre), PC demo competition: 1st, with
  3,100 points.
- **Terms**: BOOST.NFO: "this demo may freely be copied and distributed if no money is charged for it."
  and "in plain english this means that you are not allowed to make money on BOOST without the
  written permission from the Doomsday crew." MRI's own page links this file as Boost's "original DOS
  version".
- **Archive**: <https://files.scene.org/get/parties/1997/assembly97/demo/boostfin.zip>, 4,640,833 bytes,
  MD5 `82e2c92f371d3ed07aeb87b51014e8db`, as is (Hornet's and the IA's copies are the same file).
- **Runs**: `--preset demo --cycles max --gus --exe BOOST.EXE`. No start keys; MIDAS picks the GUS.
  320x200 hi-colour through VESA (keep svga_s3); flashing at most 1 a second. About 4:46; its last
  part (the Lego man of pouet's screenshot) and the return to DOS were not seen. Escape returns to
  DOS. At max cycles its frame rate depends on the host: on a heavily loaded machine one part nearly
  froze for 7 s [skeptic]. That its heavy parts draw only 3 to 5 frames a second at 30000, and that
  its GUS plays about 12 dB quieter than the SB16, are [vetter only].
- **Skeptic**: confirmed with corrections.
- **Caveats**: by far DosKit's largest archive (+60.1% on today's total). Content: a 3D Finlandia vodka
  bottle, a translucent nude-shaped figure that the camera frames from behind, and text about
  addiction ("Boost your mind get near to death") [skeptic]. Some 3D objects were "taken from the
  almighty internet", and it shows Finlandia and Lego branding. The NFO lists the members' 1997 home
  addresses.

## 3. Upgrades to what DosKit ships

### 3.1 Unreal 1.1 in place of 1.0 (`upgrade-unreal11`): recommended, with caveats

- **Archive**: <https://files.scene.org/get/demos/groups/future_crew/demos/unreal11.zip>, 1,337,312
  bytes, MD5 `8eb4ba9bf5a43510c6b19047d3eafd37`, as is: Future Crew's folder on scene.org, the copy the
  Internet Archive emulates and pouet links. 22,576 bytes more than today's `unreal.zip`.
- **Terms**: README.1ST: "This demo is freeware. It can be freely distributed without modifications.
  No money can be charged for it." Version 1.0's README.NOW gives only a copyright, so the archive
  would state its own terms. FCINFO12.TXT, inside it, says the same as the files DosKit already
  quotes.
- **Runs**: `--exe UNREAL.EXE --core auto --cycles 30000 --gus --keys "4:Enter"`: DosKit's Unreal
  settings plus a GUS at 240/5/3. Its setup preselects "Gravis Ultrasound 44Khz", so the start is one
  Enter, ready `{ "frames": [1118081498] }`, instead of 1.0's five keys. The vetter ran every part
  group (P1 to P9) with GUS sound; the skeptic ran the opening, World Vector and P5. The COLORS
  part's flagged "flash" is a checkerboard dither that alternates every frame, the same in 1.0 (vetter
  and skeptic).
- **What changes from 1.0**: the double scroller's two-voice comic dialogue, swearing included, becomes
  three short lines, so the demo is about 82 s shorter; and "LET'S KICK SOME BALLS" becomes "IN JUST
  ONE MOMENT" [skeptic]. Whether 1.0's scroller bars pulse and 1.1's do not is open [skeptic]. The
  page must say it is the 1993 version.
- **Only the vetter saw**: a GUS noise floor 15 to 25 dB below 1.0's SB Pro at 20 kHz; frames identical
  to 1.0's at a constant 82.40 s offset after the scroller, which the second text change makes too
  strong a claim.
- **Work**: the year becomes 1993 under DosKit's rule (the RELEASES table in
  `src/config/apps.config.test.ts`, and the banner line `echo   1992 - Assembly 1992 Winner` in
  `src/dos-apps/unreal.config.ts`, which the year test reads); rewrite the test at line 209 of
  `apps.config.test.ts` ("should start Unreal on SoundBlaster Pro at 20 kHz"); rewrite the text about
  the five SB Pro keys in `README.md` (line 523), `public/llms-full.txt` (line 401) and
  `src/dos-apps/README.md` (lines 184 and 204-205); the config's comments, the page file, the
  `public/demos/README.md` entry; `npm run generate-app-lists`; measure the fingerprint again; redo
  the 386DX-40 accuracy note, which was measured on 1.0 [skeptic for most of this list]. Keeping 1.0
  and adding 1.1 beside it would cost 1.34 MB for a near-duplicate.

### 3.2 VLA's own packages in place of `3drotate.zip` and `stars.zip` (`upgrade-vla-packages`): recommended

- **Archives**: <https://files.scene.org/get/mirrors/hornet/code/effects/3d/rotate3d.zip>, 35,866 bytes,
  MD5 `8bc7f93770c11d8c8c272b8eac0f834f` (11 files: the program, its tutorial, its source, its
  build files, VLA.NFO and an earlier nested package); and
  <https://files.scene.org/get/mirrors/hornet/code/effects/stars/stars.zip>, 10,627 bytes, MD5
  `293e8671504029bb9cf229c7bb30b7fd` (6 files). Both as is, renamed only. Their EXEs are byte for
  byte DosKit's current ones (MD5 and cmp, vetter and skeptic). 42,020 bytes more in all.
- **Runs**: unchanged under DosKit's own configs; DOS finds the lowercase names. The vetter's baseline
  runs gave the same first 58 and 93 frames in order as DosKit's current ZIPs; the skeptic's runs
  confirmed the keys and the colours.
- **Terms**: still none found. VLA's own index, 00INDEX.VLA (by Lithium, dated 3/16/94, in x2ftp's VLA
  folder): "All of these files should be found on our disro sites, or on the major Internet demo
  sites." [skeptic].
- **Skeptic's corrections**: the files match x2ftp's `rotate3d.lzh` and `stars.lzh` byte for byte
  with the same dates, but that those LZHs are VLA's own is unproven: 00INDEX.VLA names VLA's
  packages 3DROTATE.ZIP (35,712 bytes) and STARS.ZIP (10,624 bytes), and DOS ZIPs of those names are
  listed on 1990s shareware CDs whose hosts could not be reached. Call the nested `3drotate.zip` "an
  earlier package of 25 February 1993", and pouet's `star_field.zip` "a later repack whose files are
  dated 3 February 1997".
- **Effect**: the sentence in `public/demos/README.md` that every archive is served byte for byte as
  its source has it becomes true for these two (section 6).
- **Work**: `archiveBytes` in both data files; the README entries; the configs' comments and the banner
  line "From Grumpy's Source Pack Collection" (lines 7 and 45 of both config modules); the page
  links (pouet 69050 and Demozoo 168586 for the starfield); `docs/SCENERS.md`.

### 3.3 2NDFIX for Second Reality (`upgrade-2ndpatch`): not recommended

Seen by the vetter only; no skeptic was assigned to a rejection. Details in section 5.

## 4. Not yet

| Production                   | What it needs                                                                                                                 |
| ---------------------------- | ----------------------------------------------------------------------------------------------------------------------------- |
| Juice (Psychic Link, 1995)   | One watch of the party build's last ~70 s, a decision to ship the hurried party version, and acceptance of "none found" terms |
| Crystal Dream (Triton, 1992) | One watch of its second half, which went black and still in the only look at it; digit key names                              |
| X14 (Orange, 1995)           | Orange's permission; technically ready                                                                                        |

### 4.1 Juice (`juice-psychic-link`)

Vetter and second try only: no skeptic was assigned.

- **By**: Psychic Link: code Statix (Alex Evans) and S-Cubed, music Skywalker (Nick Boultbee).
  Assembly '95 (Helsinki): 2nd in the PC demo competition.
- **Terms**: none found in either build: JUICE.NFO gives a copyright line ("Copyright (c)1995 Psychic
  Link") and a liability disclaimer. It would be another "none found" archive; asking the group would
  settle it.
- **Why not the shortlisted archive**: `juice11.zip`, the final v1.1, freezes at 165 s after DOSBox
  starts, in its terrain part, in every configuration tried with the GUS (30000 and max cycles, EMS
  off, 8 MB); both Sound Blaster paths are silent, because the demo writes every DSP byte twice. The
  second try traced the freeze to v1.1's frame timer, which its bugfix locks to the vertical
  retrace; no DOSBox setting changes that.
- **The build that runs**: the party version,
  <https://files.scene.org/get/mirrors/hornet/demos/1995/j/juice.zip>, 855,132 bytes, MD5
  `952bc893d17a80650d324acac88fa22d`, as is. `--preset demo --gus --machine vgaonly --exe JUICE.EXE
--keys "4:Enter"`: Enter accepts the GUS it detects, ready
  `{ "stdout": "Press 1 to 4 to select a new card" }`. It played past v1.1's freezing point, through
  the pool, the tunnel and the Mandelbrot zoom, with GUS music to the end of a 240 s run; flashing at
  most 4 a second in one quarter for one second.
- **Needs**: one watch of its last ~70 s (the Rasters, Vast and Juice Pillar screens, the end
  scroller, the fast "trance" finale and its flashing, and whether it returns to DOS); the
  maintainer's choice of the party release, "finished in a real hurry at the party place" by its own
  NFO, over the final one.

### 4.2 Crystal Dream (`triton-crystal-dream`)

The vetter recommended it with caveats; the skeptic's finding makes it conditional.

- **By**: Triton: Vogue (Magnus Högdahl), Mr. H (Fredrik Huss) and Loot (Anders Aldengård). It would
  pair with DosKit's Crystal Dream 2.
- **Party**: Hackerence 1992 ("Hackerence 5", Härnösand, Sweden, 15 to 17 May 1992): 1st in the PC
  demo competition, though its README says the version shown there was unfinished. Assembly '92: 2nd
  in some of scene.org's results files and missing from another; Demozoo notes "Incomplete and
  conflicting information".
- **Terms**: none found. The README, its only text, has no licence and nothing against copying, as for
  Crystal Dream 2.
- **Archive**: <https://files.scene.org/get/demos/groups/triton/cd_trn.zip>, 1,073,539 bytes, MD5
  `89765bbdf3f03efea68539f3a30b2665`, as is (the IA's copy is the same file).
- **What was seen**: `--preset demo --exe CRYSTAL.EXE --keys "4:2, 6:1, 8:6"`: 2 (the "Sound player",
  a parallel-port DAC), 1 (LPT1), 6 (30 kHz), which need digit key names. Its music plays through
  DOSBox's Disney Sound Source emulation, already on in DosKit's presets; both Sound Blaster choices
  are silent here, which Scali's posts and the DOSBox-X notes explain [skeptic]. Its first part's
  picture is right (a frame matches Demozoo's screenshot); no flashing.
- **Needs**: (1) a watch of its second half. CRYSTAL.EXE runs DREAM.DAT as a second program about 3:54
  in; in the skeptic's run the screen then went to 320x200 and stayed black and still, nearly silent,
  for the last 4 s that could be watched [skeptic]. If that part hangs, the recommendation falls.
  The harness stops at 240 s, so this needs DosKit's dev server. (2) Digit key names. (3) A
  third-party analysis says its end scroller repeats and it returns to DOS only after Escape
  [skeptic, a lead]. (4) A place in "For Rights Holders".

### 4.3 X14 (`x14-orange`)

The vetter recommended it with caveats; the triage, the vetter and the skeptic all advise asking
Orange first.

- **By**: Orange: Hoplite (programmer), Dune (music programmer), Der Piipo (graphics programmer); "Ivy
  managed". Juhla 1995 2½ (30 June to 2 July 1995, Iisalmi, Finland): 1st in the PC demo competition.
- **Terms**: none found. X14's INFOFILE and FILE_ID.DIZ hold only credits and requirements, and its
  ZIP comment is a wordless logo. Orange's own texts for three other productions of June to August
  1995 bar CD-ROMs without the group's written permission and bar selling, and one adds "also, no
  new distribution sites". None of that forbids a free website, but nothing grants one either.
- **Needs**: Orange's permission. The 1995 files name Hoplite (Mikko Wilkman), Dune (Lassi Nikko) and
  Der Piipo (Iiro Harra); the group released a demo with Byterapers at Assembly Summer 2025. Without
  it, X14 could still be added as a "none found" archive, as the vetter allowed.
- **Technically ready**: <https://files.scene.org/get/parties/1995/juhla95-2/demo/x14.zip>, 693,581
  bytes, MD5 `927864f25ce80fcc2e6294fba49398bb`, as is (Hornet's copy, 692,057 bytes, is the same
  release without the comment). `--preset demo --gus --exe X14.EXE`, no start keys; it needs the GUS
  (silent, and racing ahead of its music, without one). It never returns to DOS, so DosKit's end card
  cannot appear. `flashing: true` as the cautious choice, for one half-second burst at about 1:08. It
  matches a capture on a Pentium III with a GUS, part for part.

## 5. Rejected after vetting

No production was rejected on its terms or its running. Two things were:

- **2NDFIX, Second Reality's slowdown patch** (`upgrade-2ndpatch`; vetter only). Future Crew's
  February 1994 fix for the demo crawling at 1 to 5 frames a second on some fast motherboards
  (READ.ME). <https://files.scene.org/get/demos/groups/future_crew/demos/2ndpatch.zip>, 38,274 bytes,
  MD5 `330b68a49522c23b703fea4739b451e7`; freeware under FCINFO13. At DosKit's 24000 cycles the
  patched demo starts, looks and times like the original (the same setup fingerprint, 2260734480),
  because the slowdown never occurs under DOSBox. At max cycles it does not prevent the
  default-palette fault: two of three patched runs showed it for about 14.5 s, as the unpatched run
  did. Using it would need a second archive in the emulator's file system and a 1994 loader in place
  of the 1993 one. At most it is worth a line on Second Reality's About panel, which must not
  present it as a fix for the palette fault.
- **Juice's v1.1 archive**, `juice11.zip` (868,789 bytes, MD5 `0908a0f37d76419cec72f57d17bec901`): it
  freezes at 165 s in js-dos 8.3.20 (section 4.1). `juice105.zip` carries the same v1.1 code over the
  party build, so the second try expects it to freeze too; it was not run.

Copies the vetting ruled out in favour of the ones in section 2:

| Copy                                                | Why not                                                        |
| --------------------------------------------------- | -------------------------------------------------------------- |
| Verses' party version (`emf_vrs.zip`, `verses.zip`) | GUS-only, needs 512 KB on the GUS, hangs on fast machines      |
| Heartquake's party-folder `heartq.zip`              | a third-party repack without Iguana's BLASTER.COM              |
| Holistic's Hornet copy                              | the same files with a different BBS comment                    |
| DX Project's `rt_dxprj.zip`                         | adds PARAZITE.COM, a BBS advert, and a ThunderByte file        |
| Untitled's party version                            | GUS-only; a BBS's "expressly forbidden by Federal Law" comment |
| SOPPA in Future Crew's folder                       | no terms; a BBS advert as FILE_ID.DIZ                          |
| Kukoo2's `kuk2src.zip`                              | the "large" build, with crude and racist 1990 text             |
| Composer 669 from the Media Share CD                | its COMPOSD.CFG breaks the start and the colours               |
| Iris' top-level IRIS.EXE                            | a later build by an unknown hand; run BIG\IRIS.EXE             |
| X14's group-folder copies (`x14.zip`, `x14or.zip`)  | a BBS advert with a CP437 character in its name                |
| Machines of Madness's `machifix.zip`                | a patch over the release, not a release                        |
| Solstice's January 1996 build                       | a separate release made for a PC Format CD                     |
| Journey's group-folder copies                       | the originals with scene.org's notice and comment added        |

## 6. Corrections to DosKit's own documents

1. **ROADMAP.md, "Next", item 4**: "X14 by Orange (1995) and Adlib Tracker II, the two DOS programs of
   the old list that are free to redistribute." Nothing supports this for X14: its own files state no
   terms, and Orange's own texts of mid-1995 for three other productions restrict CD-ROMs and selling
   and refuse "new distribution sites" (section 4.3). The words "free to redistribute" came in commit
   `d1d5df3` (2026-11-11, "docs: say what DosKit is in one sentence, everywhere it introduces
   itself"); X14 entered the roadmap's wishlist in `7c5d494` (2025-11-18, "feat: roadmap"). The
   vetter named commit `efb72f1`, which does not touch ROADMAP.md [skeptic; confirmed with `git log`
   by this report]. For Adlib Tracker II the claim holds under GPL v3 or later, but with duties the
   roadmap does not mention (the source beside the binaries, the licence text, a CWSDPMI notice).
2. **public/demos/README.md, "For Rights Holders"**: "Every archive here is served as its source has
   it, byte for byte". It is not true of `3drotate.zip` (2,991 bytes) and `stars.zip` (1,482 bytes):
   their own entries show they are one-file ZIPs DosKit made around an EXE that is byte for byte the
   one in Grumpy's source pack. VLA's packages exist on Hornet, and `docs/SCENERS.md`, integration
   step 1, says to "Zip loose files only when no package exists". The VLA upgrade (section 3.2)
   makes the sentence true again; a repacked Holistic would make it false again [triage, and the
   skeptic of the VLA upgrade].
3. **src/dos-apps/README.md, step 4** ("then checks for 4 seconds that the screen went on"), and
   **docs/ARCHITECTURE.md** ("For 4 seconds after the keys, the recipe checks that the screen went
   on"): `runStartRecipe` in `src/utils/startRecipe.ts` defaults `verifyMs` to `6_000`, and
   `src/components/DosPlayerWithApps.tsx` does not override it, so the check runs for 6 seconds
   [skeptics of Mental Surgery, DX Project and Crystal Dream; confirmed in the source by this
   report].
4. **src/dos-apps/README.md, step 2**, a minor one: at cycles `'max'`, "Second Reality showed the
   default VGA palette for about 12 seconds near 1:30 in most runs". The 2NDFIX vetting measured it
   at 14.5 to 14.6 s (from 82 to 88 s until 97 to 103 s after DOSBox started) in three of four max
   runs, one of them unpatched [vetter only].

## 7. Deferred by triage, worth a later round

From the triage's list of 99 deferred or ruled-out entries, leaving out the five that were vetted
anyway (Dope, Crystal Dream, Juice, Machines of Madness, Boost):

- **Size-coded**: Heaven (BARTi of NoooN, 1995; explicit permission; 2nd in Assembly '95's 4K);
  Fractals (Schwartz, 1994; explicit terms; would pair with Animate); Symbology (Admire, 1993;
  explicit terms; 2nd in The Party '93's 80K); Jizz and Stash (The Black Lotus, 1997; explicit
  non-commercial terms; the Wired '97 and The Party '97 64K winners; a 1 MB GUS and VESA hi-colour).
- **256-byte intros, a later round**: Řrřola's Puls, Symetrie, Mixér and Dírojed (ISC licence; Puls
  reported as a slideshow in DOSBox) and Gargaj's four (explicit "free to distribute" terms, with
  sources; one reported too slow).
- **Iguana, a second round**: Despair (1996; freely distributable; the Euskal '96 winner; a Pentium
  100 and VESA hi-colour; Demozoo tags it nsfw), BlasterSound BBS Intro #1 and The Cop (1993; public
  domain by RELEASES.TXT; both copies are repacks, and #1 is silent).
- **Tran's third**: Fantasy (1994 musicdisk; explicit terms; FANTASY.DOC says most samples are ripped).
- **Type One's first**: Kukoo (1993; MIT-style licence; the only archive is a 2001 repack of v1.16;
  its tune is Laxity's).
- **Orange, after permission**: Television (its only term restricts CD-ROMs), Project XYZ, The Secret
  Life of Mr. Black, Super Television, Megablast (2.97 MB), you am i you am the robot, Compost
  (reported to show only its music in DOSBox); none states terms.
- **Early PC**: VectorDemo (UltraForce, 1991) and ColdCut (UltraForce, 1990), public domain by
  UltraForce's ORDER.FRM (in another archive); VectorDemo's install menu needs keys, ColdCut is EGA
  and Demozoo tags it as using commercial music.
- **Musicdisks, once the kind is settled**: Progression (Necros of Five Musicians, 1995; explicit
  non-commercial terms; the triage's best non-Future Crew musicdisk).
- **Trackers**: FunkTracker 1.08d (freeware with public-domain source; no example song; no DOSBox
  evidence); Velvet Studio 2.01 (its README says "shareware product ONLY", its author's 2013 note
  says that meant free use and the source is under the Unlicense, but 2.01 is only a patch); Reality
  AdLib Tracker (no terms; ask Reality).
- **Effects**: 3D Graphics Demonstration / TEXMAP (Ultimate Brains, 1993; FREEWARE in its FILE_ID.DIZ;
  listed as ready in `docs/SCENERS.md`; first in line); JCL-Plasma v1.3a (Jezza, 1994; asks only that
  the ZIP stay intact); VLA's other examples (Mode-X Vertical Scroller, Palette Rotate, Modex, Text
  Ball, Waves, Font scrollers, Sea Sick), for a VLA round, though only two come near terms.
- **Party winners without terms**: Caero (The Party '95), Facts of Life (The Party '92); Opticron (the
  NAID '95 winner, freeware, little known). Bussimatkaintro 94 is a joint release with no terms of its
  own.
- **Back only if DosKit gets a MIDI synth**: Omniscent, Little Big Demo, Difúze, Star Trip and Forever
  Reality, whose music is General MIDI, which js-dos 8.3.20 does not synthesise.

## Where the evidence is

The vetting harness, its runs, the screenshots and each item's notes were kept outside the
repository and are not part of it.
