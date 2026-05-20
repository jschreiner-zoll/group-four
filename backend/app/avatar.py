"""Deterministic Meta-style SVG avatar generator based on patient attributes.

Produces avatars in the style of Meta's consumer avatars (Horizon Worlds / Instagram):
soft rounded features, gradient shading, stylized volumetric hair, large expressive
eyes with highlights, subtle nose, and friendly expressions.
"""

import hashlib


# Warm skin tones with gradient pairs (base, shadow)
SKIN_TONES = [
    ("#FDDCB5", "#F0C090"),
    ("#F5D0A9", "#E0B080"),
    ("#E8B896", "#D09870"),
    ("#C8946E", "#A87050"),
    ("#A0704A", "#805030"),
    ("#6B4226", "#4A2E1A"),
]

# Hair colors
HAIR_COLORS = [
    "#1A1A2E",  # Black
    "#3D2314",  # Dark brown
    "#6B3A2A",  # Brown
    "#8B5E3C",  # Light brown
    "#C4883C",  # Blonde
    "#E8B960",  # Light blonde
    "#A0522D",  # Auburn
    "#8B8B8B",  # Gray
]

# Eye colors
EYE_COLORS = ["#4A3728", "#2E5A3A", "#3A5A8C", "#6B5A3A", "#2A4A6A", "#5A3A5A"]

# Shirt/clothing colors (soft, modern)
SHIRT_COLORS = ["#5B8BD4", "#6BBF6B", "#D46B6B", "#D4A44B", "#8B6BD4", "#4BC8B0", "#D46BAA", "#4BA8D4"]

# Background gradients (soft pastels)
BG_COLORS = [
    ("#E8F4FD", "#D0E8F8"),
    ("#FDE8EC", "#F8D0D8"),
    ("#E8FDF0", "#D0F8E0"),
    ("#FDF8E8", "#F8F0D0"),
    ("#F0E8FD", "#E0D0F8"),
    ("#E8FDFA", "#D0F8F0"),
]


def _hash_patient(name: str, age: int) -> int:
    seed = f"{name}:{age}"
    return int(hashlib.sha256(seed.encode()).hexdigest(), 16)


def generate_avatar_svg(name: str, age: int) -> str:
    """Generate a Meta-style avatar SVG for a patient."""
    h = _hash_patient(name, age)

    # Select features deterministically
    skin_base, skin_shadow = SKIN_TONES[h % len(SKIN_TONES)]
    hair = HAIR_COLORS[(h >> 4) % len(HAIR_COLORS)]
    eye_color = EYE_COLORS[(h >> 8) % len(EYE_COLORS)]
    shirt = SHIRT_COLORS[(h >> 12) % len(SHIRT_COLORS)]
    bg_top, bg_bottom = BG_COLORS[(h >> 16) % len(BG_COLORS)]

    # Feature variations
    face_width = 30 + (h >> 20) % 5       # 30-34
    face_height = 33 + (h >> 24) % 4      # 33-36
    eye_size = 4 + (h >> 28) % 2          # 4-5 (larger = more Meta-like)
    eye_spacing = 9 + (h >> 32) % 3       # 9-11
    brow_arch = 2 + (h >> 36) % 2         # 2-3
    mouth_curve = 3 + (h >> 40) % 3       # 3-5
    hair_style = (h >> 44) % 5            # 0-4
    has_facial_hair = (h >> 48) % 4 == 0  # 25% chance
    ear_size = 4 + (h >> 52) % 2          # 4-5

    face_cx, face_cy = 50, 48
    eye_y = face_cy - 3

    svg = f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100">
  <defs>
    <radialGradient id="bg_{h % 999}" cx="50%" cy="40%" r="60%">
      <stop offset="0%" stop-color="{bg_top}"/>
      <stop offset="100%" stop-color="{bg_bottom}"/>
    </radialGradient>
    <radialGradient id="skin_{h % 999}" cx="45%" cy="35%" r="60%">
      <stop offset="0%" stop-color="{skin_base}"/>
      <stop offset="100%" stop-color="{skin_shadow}"/>
    </radialGradient>
    <radialGradient id="eye_{h % 999}" cx="40%" cy="35%" r="50%">
      <stop offset="0%" stop-color="{eye_color}"/>
      <stop offset="100%" stop-color="#1a1a1a"/>
    </radialGradient>
  </defs>

  <!-- Background -->
  <circle cx="50" cy="50" r="50" fill="url(#bg_{h % 999})"/>

  <!-- Neck -->
  <rect x="43" y="62" width="14" height="12" rx="5" fill="url(#skin_{h % 999})"/>

  <!-- Shoulders/Shirt -->
  <ellipse cx="50" cy="82" rx="26" ry="18" fill="{shirt}"/>
  <ellipse cx="50" cy="80" rx="22" ry="14" fill="{shirt}" opacity="0.8"/>

  <!-- Ears -->
  <ellipse cx="{face_cx - face_width + 2}" cy="{face_cy + 2}" rx="{ear_size}" ry="{ear_size + 1}" fill="url(#skin_{h % 999})"/>
  <ellipse cx="{face_cx + face_width - 2}" cy="{face_cy + 2}" rx="{ear_size}" ry="{ear_size + 1}" fill="url(#skin_{h % 999})"/>

  <!-- Face (rounded, soft) -->
  <ellipse cx="{face_cx}" cy="{face_cy}" rx="{face_width}" ry="{face_height}" fill="url(#skin_{h % 999})"/>

  <!-- Cheek blush (subtle) -->
  <ellipse cx="{face_cx - 12}" cy="{face_cy + 8}" rx="6" ry="4" fill="#FFB0A0" opacity="0.15"/>
  <ellipse cx="{face_cx + 12}" cy="{face_cy + 8}" rx="6" ry="4" fill="#FFB0A0" opacity="0.15"/>'''

    # Hair styles (volumetric, Meta-like)
    if hair_style == 0:
        # Short styled (like Zuckerberg's classic cut)
        svg += f'''
  <ellipse cx="50" cy="32" rx="{face_width + 2}" ry="20" fill="{hair}"/>
  <ellipse cx="50" cy="28" rx="{face_width - 2}" ry="14" fill="{hair}"/>
  <path d="M{50 - face_width + 5} 38 Q50 26 {50 + face_width - 5} 38" fill="{hair}"/>'''
    elif hair_style == 1:
        # Longer swept
        svg += f'''
  <ellipse cx="50" cy="30" rx="{face_width + 3}" ry="22" fill="{hair}"/>
  <path d="M{50 - face_width - 2} 42 Q{50 - face_width + 5} 20 55 24 Q65 20 {50 + face_width + 2} 36" fill="{hair}"/>
  <ellipse cx="48" cy="27" rx="{face_width}" ry="15" fill="{hair}"/>'''
    elif hair_style == 2:
        # Curly/voluminous
        svg += f'''
  <circle cx="42" cy="28" r="12" fill="{hair}"/>
  <circle cx="58" cy="28" r="12" fill="{hair}"/>
  <circle cx="50" cy="25" r="13" fill="{hair}"/>
  <circle cx="36" cy="34" r="8" fill="{hair}"/>
  <circle cx="64" cy="34" r="8" fill="{hair}"/>'''
    elif hair_style == 3:
        # Parted
        svg += f'''
  <ellipse cx="50" cy="30" rx="{face_width + 1}" ry="20" fill="{hair}"/>
  <path d="M35 36 Q42 20 50 24 Q50 20 42 36 Z" fill="{hair}" opacity="0.8"/>
  <path d="M50 24 Q58 20 68 36 Q60 22 50 24 Z" fill="{hair}" opacity="0.9"/>'''
    else:
        # Pulled back / short cropped
        svg += f'''
  <ellipse cx="50" cy="32" rx="{face_width - 1}" ry="18" fill="{hair}"/>
  <rect x="{50 - face_width + 4}" y="26" width="{(face_width - 4) * 2}" height="8" rx="4" fill="{hair}"/>'''

    # Eyebrows (expressive, slightly thick)
    svg += f'''
  <path d="M{face_cx - eye_spacing - 4} {eye_y - 6 - brow_arch} Q{face_cx - eye_spacing} {eye_y - 8 - brow_arch} {face_cx - eye_spacing + 5} {eye_y - 6}" fill="{hair}" opacity="0.7" stroke="{hair}" stroke-width="1.2" stroke-linecap="round" fill="none"/>
  <path d="M{face_cx + eye_spacing - 5} {eye_y - 6} Q{face_cx + eye_spacing} {eye_y - 8 - brow_arch} {face_cx + eye_spacing + 4} {eye_y - 6 - brow_arch}" fill="{hair}" opacity="0.7" stroke="{hair}" stroke-width="1.2" stroke-linecap="round" fill="none"/>'''

    # Eyes (large, expressive with white, iris, pupil, and highlight - Meta signature)
    for ex in [face_cx - eye_spacing, face_cx + eye_spacing]:
        svg += f'''
  <ellipse cx="{ex}" cy="{eye_y}" rx="{eye_size + 1}" ry="{eye_size}" fill="white"/>
  <circle cx="{ex}" cy="{eye_y + 0.5}" r="{eye_size - 1}" fill="url(#eye_{h % 999})"/>
  <circle cx="{ex}" cy="{eye_y + 0.5}" r="{eye_size - 2.5}" fill="#111"/>
  <circle cx="{ex - 1}" cy="{eye_y - 1}" r="1.2" fill="white" opacity="0.9"/>'''

    # Nose (subtle, soft)
    nose_y = face_cy + 5
    svg += f'''
  <path d="M{face_cx - 1} {nose_y - 3} Q{face_cx} {nose_y + 2} {face_cx + 1} {nose_y - 3}" fill="none" stroke="{skin_shadow}" stroke-width="0.8" opacity="0.5"/>
  <ellipse cx="{face_cx}" cy="{nose_y + 1}" rx="2.5" ry="1.5" fill="{skin_shadow}" opacity="0.25"/>'''

    # Mouth (friendly smile - Meta avatars always look approachable)
    mouth_y = face_cy + 12
    svg += f'''
  <path d="M{face_cx - mouth_curve - 2} {mouth_y} Q{face_cx} {mouth_y + mouth_curve + 1} {face_cx + mouth_curve + 2} {mouth_y}" fill="none" stroke="#C06060" stroke-width="1.8" stroke-linecap="round"/>
  <path d="M{face_cx - mouth_curve} {mouth_y + 0.5} Q{face_cx} {mouth_y + mouth_curve - 1} {face_cx + mouth_curve} {mouth_y + 0.5}" fill="#E88080" opacity="0.3"/>'''

    # Facial hair (if applicable)
    if has_facial_hair:
        svg += f'''
  <path d="M{face_cx - 6} {mouth_y + 2} Q{face_cx} {mouth_y + 6} {face_cx + 6} {mouth_y + 2}" fill="{hair}" opacity="0.3"/>'''

    svg += '\n</svg>'
    return svg
