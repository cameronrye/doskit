# DosKit Roadmap

> DOS demoscene classics and the trackers behind them, playable in your browser.

DosKit is a small, curated collection rather than a catalogue. Each production runs from its
original files, starts with one press, has a page of its own, and is checked against captures
from real hardware where there are any. It grows by sets of productions that belong together,
and only once the ones it has run as they should. The Internet Archive already runs thousands
of DOS productions in the browser; what DosKit adds is the care for each one.

**Explicitly excluded**: games, productivity software, and programs for other platforms.

## Done (November 2026)

- **Ten programs**: Second Reality, Unreal and Panic by Future Crew; Crystal Dream 2 by Triton;
  StarPort BBS Intro II by Future Crew and the Squid BBS Intro by cld & The Doctor; Impulse
  Tracker by Jeffrey Lim and Scream Tracker 3 by Future Crew; and two examples from VLA's
  assembly tutorials, the 3D Rotation Demo and the Starfield Effect. Where each comes from, and
  its authors' terms, are in [public/demos/README.md](public/demos/README.md).
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
- **Tracker files kept**: what Impulse Tracker and Scream Tracker 3 save stays in the browser,
  and can be downloaded, replaced by files of your own, or reset.
- **Flashing warnings** for Panic, Second Reality and Crystal Dream 2.
- **Offline**: an installable web app; each archive is stored on its own, so a change to one
  leaves the others in place.
- **Tested in a browser**: every production is started in Chromium in CI, with its picture and
  its sound checked.

## Next

1. **Real devices.** An hour each on an iPhone, an Android phone, Safari and Firefox on a desktop,
   and Chrome on Windows: the start keys, sound after one tap, the on-screen keyboard, and the
   trackers' files.
2. **Accuracy notes for every production**, from the same frame-by-frame comparison with captures
   of real machines, kept with each production's page.
3. **A Future Crew shelf.** FCINFO17.TXT, in the Scream Tracker 3 archive, makes all of Future
   Crew's own demos and programs freeware; seventeen more of their releases may run in js-dos.
   Each needs a run, a capture to compare with, and its own start keys first.
4. **X14** by Orange (1995) and **Adlib Tracker II**, the two DOS programs of the old list that
   are free to redistribute.
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
- **A module player, MIDI, audio or video recording**: the trackers play modules themselves, and
  a browser can already record a tab.
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
