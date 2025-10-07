# DOSBox Configuration Comparison

## Overview

This document compares the DOSBox configurations used for different applications in the doskit project, explaining why each application has specific optimizations.

## Configuration Matrix

| Setting | Second Reality | Impulse Tracker | Default Config | Rationale |
|---------|---------------|-----------------|----------------|-----------|
| **CPU Core** | dynamic | dynamic | auto | Dynamic core provides best performance |
| **CPU Type** | pentium | pentium | auto | Pentium offers better instruction set |
| **Cycles** | max | 15000 (fixed) | max | Demos need max speed; trackers need stability |
| **Video Memory** | 8 MB | 2 MB | 8 MB | Demos need graphics; trackers use text mode |
| **Mixer Config** | Not specified | Optimized | Not specified | Trackers benefit from explicit mixer settings |
| **GUS Support** | Enabled | Optional | Disabled | Both benefit from GUS audio quality |

## Detailed Comparison

### Second Reality (Demo)

```ini
[cpu]
core=dynamic
cputype=pentium
cycles=max

[video]
vmemsize=8

[mixer]
# Not explicitly configured - uses defaults
```

**Purpose**: Visual demo with pre-rendered content
**Priorities**:
1. Maximum graphics performance
2. Smooth 3D rendering
3. Synchronized audio/video

**Why `cycles=max`?**
- Pre-rendered demo benefits from maximum speed
- Audio is synchronized to visuals, not real-time
- No interactive input requiring consistent timing
- Faster = smoother graphics

### Impulse Tracker (Music Tracker)

```ini
[cpu]
core=dynamic
cputype=pentium
cycles=15000

[video]
vmemsize=2

[mixer]
nosound=false
rate=44100
blocksize=2048
prebuffer=25
```

**Purpose**: Interactive music creation tool
**Priorities**:
1. Stable, consistent audio timing
2. Responsive user interface
3. No audio stuttering or glitches

**Why `cycles=15000` (fixed)?**
- Real-time audio processing requires consistent timing
- Interactive input needs predictable performance
- Fixed cycles prevent audio buffer issues
- Stability > maximum speed

**Why explicit mixer settings?**
- Music applications are sensitive to audio buffering
- Larger blocksize prevents stuttering
- Proper prebuffer ensures smooth playback
- Critical for professional music work

### Default Configuration

```ini
[cpu]
core=auto
cputype=auto
cycles=max

[video]
vmemsize=8

[mixer]
# Not explicitly configured
```

**Purpose**: General-purpose DOS environment
**Priorities**:
1. Maximum compatibility
2. Good performance for most applications
3. Reasonable defaults

**Why `auto` settings?**
- Adapts to different applications
- Safe defaults for unknown software
- Good starting point for experimentation

## Application-Specific Optimizations

### Graphics-Intensive Applications (Demos, Games)

**Recommended Settings:**
```ini
[cpu]
core=dynamic
cputype=pentium
cycles=max

[video]
vmemsize=8
```

**Examples:**
- Second Reality
- 3D demos
- Graphics-heavy games

**Rationale:**
- Need maximum CPU speed for rendering
- Benefit from larger video memory
- Audio is secondary to visuals

### Audio-Intensive Applications (Trackers, Music Software)

**Recommended Settings:**
```ini
[cpu]
core=dynamic
cputype=pentium
cycles=10000-20000 (fixed)

[mixer]
nosound=false
rate=44100
blocksize=2048
prebuffer=25
```

**Examples:**
- Impulse Tracker
- FastTracker 2
- Scream Tracker 3

**Rationale:**
- Fixed cycles ensure stable audio timing
- Explicit mixer settings prevent stuttering
- Consistency > maximum speed

### Text-Based Applications (Editors, Utilities)

**Recommended Settings:**
```ini
[cpu]
core=auto
cputype=486
cycles=auto

[video]
vmemsize=2
```

**Examples:**
- Text editors
- File managers
- Command-line utilities

**Rationale:**
- Don't need high performance
- Minimal resource requirements
- Auto settings work well

## Key Differences Explained

### 1. Cycles: Fixed vs. Max vs. Auto

#### `cycles=max`
- **Best for**: Pre-rendered content, demos, games
- **Pros**: Maximum performance, smooth graphics
- **Cons**: Can cause audio timing issues in interactive apps
- **Use when**: Speed is more important than consistency

#### `cycles=15000` (fixed)
- **Best for**: Interactive audio applications, trackers
- **Pros**: Stable timing, consistent performance, no audio glitches
- **Cons**: May not utilize full CPU potential
- **Use when**: Consistency is more important than speed

#### `cycles=auto`
- **Best for**: General-purpose applications
- **Pros**: Adapts to application needs
- **Cons**: Can vary unpredictably, may cause issues
- **Use when**: You don't know the application's requirements

### 2. Mixer Configuration

#### Explicit Mixer Settings (Impulse Tracker)
```ini
[mixer]
nosound=false
rate=44100
blocksize=2048
prebuffer=25
```

**Why?**
- Music applications are extremely sensitive to audio buffering
- Prevents stuttering and dropouts
- Ensures professional-quality audio output
- Critical for real-time audio processing

#### Default Mixer (Second Reality, Default Config)
```ini
# Uses DOSBox defaults
```

**Why?**
- Demos have pre-rendered audio synchronized to visuals
- Default settings work well for most applications
- Less critical for non-interactive audio

### 3. Video Memory

#### 8 MB (Second Reality, Default)
- Needed for graphics-intensive applications
- Supports high-resolution modes
- Better for demos and games

#### 2 MB (Impulse Tracker)
- Sufficient for text-mode applications
- Frees up resources for audio processing
- Appropriate for trackers

## Performance Impact

### Second Reality
- **CPU Usage**: High (cycles=max)
- **Memory Usage**: Moderate (16 MB RAM, 8 MB VRAM)
- **Audio Quality**: Good (default mixer)
- **Graphics Quality**: Excellent (max cycles, 8 MB VRAM)

### Impulse Tracker
- **CPU Usage**: Moderate (15000 cycles)
- **Memory Usage**: Low-Moderate (16 MB RAM, 2 MB VRAM)
- **Audio Quality**: Excellent (optimized mixer)
- **Graphics Quality**: N/A (text mode)

## Choosing the Right Configuration

### Decision Tree

1. **Is it a music/audio application?**
   - Yes → Use fixed cycles (10000-20000) + explicit mixer settings
   - No → Continue to step 2

2. **Is it graphics-intensive?**
   - Yes → Use cycles=max + 8 MB video memory
   - No → Continue to step 3

3. **Is it interactive?**
   - Yes → Use fixed cycles for consistency
   - No → Use cycles=max for performance

4. **Does it need special hardware?**
   - GUS → Enable GUS configuration
   - MIDI → Configure MIDI settings
   - Network → Configure IPX/network settings

## Best Practices

### 1. Start with Application Type
- Identify whether it's a demo, game, tracker, or utility
- Choose the appropriate base configuration

### 2. Test and Adjust
- Start with recommended settings
- Monitor performance and audio quality
- Adjust cycles if needed

### 3. Document Your Changes
- Note why you chose specific settings
- Document any issues encountered
- Share findings with the community

### 4. Consider the Host System
- Slower systems may need lower cycles
- Faster systems can handle higher settings
- Test on target hardware

## Common Issues and Solutions

### Audio Stuttering in Trackers
**Problem**: Audio cuts out or stutters during playback
**Solution**: 
- Increase blocksize to 2048 or 4096
- Increase prebuffer to 25-30
- Use fixed cycles instead of auto/max

### Slow Graphics in Demos
**Problem**: Demo runs slowly or choppy
**Solution**:
- Use cycles=max
- Increase video memory to 8 MB
- Use dynamic core

### Inconsistent Performance
**Problem**: Performance varies unpredictably
**Solution**:
- Use fixed cycles instead of auto
- Use dynamic core instead of auto
- Specify explicit CPU type

## Conclusion

Different applications have different requirements:

- **Demos/Games**: Prioritize speed and graphics (cycles=max)
- **Trackers/Audio**: Prioritize stability and audio quality (fixed cycles + mixer config)
- **Utilities**: Use defaults (auto settings)

The key is understanding what each application needs and optimizing accordingly. The configurations in doskit are carefully tuned for each specific application to provide the best user experience.

