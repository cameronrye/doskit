# DosKit Roadmap

> DOS demoscene classics and the trackers behind them, playable in your browser.

DosKit is a small, curated collection rather than a catalogue. Each production runs from its
original files, starts with one press, has a page of its own, and is checked against captures
from real hardware where there are any. It grows by sets of productions that belong together,
and only once the ones it has run as they should. The Internet Archive already runs thousands
of DOS productions in the browser; what DosKit adds is the care for each one.

**Explicitly excluded**: games, productivity software, and programs for other platforms. (The
small Space Invaders game inside Future Crew's Assembly '94 Invitation Dentro is part of an
invitation, and stays with it.)

## Done (November 2026)

- **Fifty-two productions, in fifty-three apps** (Journey's two disks are one app each), added in
  sets from a round of vetting in which each was run in DosKit's js-dos build and its terms were
  read in full, by two checks of their own
  ([docs/CONTENT-CANDIDATES.md](docs/CONTENT-CANDIDATES.md)). Where each comes from, and its
  authors' terms, are in [public/demos/README.md](public/demos/README.md):
  - **Future Crew**: Second Reality, Unreal (version 1.1, for the Gravis UltraSound), Panic,
    Mental Surgery and Slideshow I; the intros GR8 and YO!, their Assembly '92, '93 and '94 and
    The Party '92 invitations, Bussimatkaintro 93, SOPPA! and both StarPort BBS intros; the
    Worldcharts #1 diskmag; the musicdisks Journey 1 and 2 by Purple Motion and Chaotic Mind by
    Skaven; and Scream Tracker 3.
  - **Assembly's winners**: the PC demo podium of 1994 (Verses, Holistic, Heartquake), the 1st
    and 3rd of 1995 (Stars: Wonders of the World, DX Project), and the winners of 1996 and 1997
    (Machines of Madness, Boost); and four size-coded winners of 1995 to 1997 (Animate, Drift,
    blind, Helium).
  - **Other parties' winners**: Crystal Dream 2 by Triton (The Computer Crossroads '93),
    Untitled by Dust (The Party '93), Dope by Complex (The Gathering '95), Solstice by Valhalla
    (Wired '95) and Pump by Iguana (Euskal '95).
  - **Iguana and VangeliSTeam** of Madrid: Heartquake, Inconexia, Pump, the BlasterSound BBS
    Intro #2, the Fire Demo, Iris and The Globe.
  - **Tran's** Timeless and Composer 669, and **Type One of TFL-TDV's** Kukoo2 and Contrast.
  - **Trackers**: Impulse Tracker, Scream Tracker 3, Composer 669, EdLib, MONOTONE and Adlib
    Tracker II, each keeping what it saves.
  - **Effects and BBS intros**: VLA's 3D Rotation Demo and Starfield Effect, now in their own
    packages, and the Squid BBS intro by cld & The Doctor.
- **Checked against real hardware**: Panic and the Squid intro draw on a plain VGA, which their
  palette effects need, and Second Reality runs at the speed of a 486DX2-66, where its palette
  stays right and its timeline matches a real one to about 1%.
- **One press to play**: each production's start keys go through js-dos's key API once its
  setup screen is up, so Unreal no longer starts without sound and Second Reality no longer waits
  at its setup. A production that returns to DOS offers to play again.
- **A page per production** at `/<id>`, such as
  [doskit.net/secondreality](https://doskit.net/secondreality), with its own
  title, description and share card, and an About panel: who made it, where it was shown, its
  terms and how faithful DosKit's version is.
- **Tracker files kept**: what the trackers save stays in the browser, and can be downloaded,
  replaced by files of your own, or reset.
- **Warnings** for the productions that flash, and notes on those that show nudity, before they
  play.
- **Offline**: an installable web app; each archive is stored on its own, so a change to one
  leaves the others in place.
- **Tested in a browser**: every production is started in Chromium in CI, with its picture and
  its sound checked.

## Next

1. **Real devices.** An hour each on an iPhone, an Android phone, Safari and Firefox on a desktop,
   and Chrome on Windows: the start keys, sound after one tap, the on-screen keyboard, and the
   trackers' files.
2. **Watch the endings no one has seen in DosKit**: Verses, Holistic, Heartquake, Stars: Wonders
   of the World, DX Project, Untitled, Dope, Machines of Madness and Boost were vetted for 4 minutes at most, and
   Inconexia was never watched whole in one run. Look at Untitled's interference rings by eye
   for its flashing.
3. **Accuracy notes for every production**, from the same frame-by-frame comparison with captures
   of real machines, kept with each production's page.
4. **Not yet**: Juice by Psychic Link (only its party build runs past 2:45, and its last 70
   seconds are unseen), Crystal Dream by Triton (its second half went black and still in the only
   look at it) and X14 by Orange (1995), whose own files state no terms: Orange should be asked
   first. Section 4 of [docs/CONTENT-CANDIDATES.md](docs/CONTENT-CANDIDATES.md) has what each
   needs, and its section 7 the leads for a later round.
5. **One listing on pouet.net**, Scream Tracker 3.21 first, with Future Crew's terms and the
   archive's checksum, and only once the above holds.
6. **Upstream.** Report js-dos's key queue freezing when two `simulateKeyPress` calls come within
   16 ms, and its mixing of stereo to mono. js-dos stays at 8.3.20 until a later version starts
   a second player on a page by itself again.

## Not planned, and why

- **Productivity software and commercial titles** (WordPerfect, Lotus 1-2-3, Turbo Pascal,
  Norton Commander): their licences don't allow it, and they are not what DosKit is for.
- **Productions for Windows or the Amiga** (fr-08, debris., Uncovering Static, Lifeforce,
  Elevated, World of Commodore): DosKit runs DOS programs. The authors of debris. and Elevated
  have also had links to unofficial browser versions removed from pouet.net.
- **A module player built into DosKit, MIDI, audio or video recording**: the trackers and the
  musicdisks play their modules themselves, and a browser can already record a tab.
- **Save states of the running machine**: js-dos keeps files, not the machine's memory.
- **Global keyboard shortcuts**: DOS programs need every key.
- **Links to a moment in a production, an embed mode, a per-app DOSBox-X option, a state
  library**: nothing needs them yet.
- **More apps for their own sake.**

## Contributing

`src/dos-apps/README.md` walks through adding a production: its archive and where it comes
from, its config, its data file and its start keys. Open an issue first for anything on the
lists above.

---

Made with ❤️ by [Cameron Rye](https://rye.dev/)
