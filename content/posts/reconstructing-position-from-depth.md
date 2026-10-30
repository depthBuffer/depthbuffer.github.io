Deferred lighting, SSAO, screen-space reflections and decals all need the same thing: the position of the surface under a pixel. You could store it in a G-buffer, but you already have the depth buffer. With the inverse projection you can get position back from one 32-bit sample.

## From pixel to NDC

A depth-buffer sample is a *window-space* value $d$. To undo the projection, map the pixel back into normalised device coordinates (NDC). The x and y mapping is the same everywhere:

$$
x_{ndc} = 2u - 1, \qquad y_{ndc} = 2v - 1
$$

The z mapping depends on the API:

| API                       | NDC z range | $z_{ndc}$ from $d$ |
|---------------------------|-------------|--------------------|
| OpenGL / WebGL            | $[-1, 1]$   | $2d - 1$           |
| Direct3D / Vulkan / WebGPU / Metal | $[0, 1]$ | $d$          |

Vulkan also points NDC +y down, so flip $v$ when using a Vulkan-style projection with a top-left texture origin.

## Undoing the projection

Projection is a linear map followed by the perspective divide. To invert it, multiply by the inverse view-projection matrix and then divide by $w$ again:

```glsl
uniform sampler2D uDepth;
uniform mat4 uInvViewProj;

vec3 worldFromDepth(vec2 uv) {
    float d = texture(uDepth, uv).r;
    vec4 ndc = vec4(uv * 2.0 - 1.0, d * 2.0 - 1.0, 1.0); // WebGL: z in [-1, 1]
    vec4 p = uInvViewProj * ndc;
    return p.xyz / p.w;
}
```

The divide is required. Inverting the projection gives you a homogeneous point, not a Euclidean one.

## Linear depth

Often you only need distance along the view axis, for fog, depth of field or bilateral filter weights. For a standard perspective projection with near plane $n$ and far plane $f$:

**OpenGL convention** ($z_{ndc} \in [-1, 1]$):

$$
z_{view} = \frac{2nf}{f + n - z_{ndc}\,(f - n)}
$$

**D3D/Vulkan convention** ($d \in [0, 1]$):

$$
z_{view} = \frac{nf}{f - d\,(f - n)}
$$

Check the endpoints: $d = 0$ gives $n$ and $d = 1$ gives $f$.

## A faster path: view rays

A full-screen pass doesn't need a matrix multiply per pixel. Interpolate a view-space ray from the vertex shader, scaled so its $z$ component is 1. Then:

$$
\mathbf{p}_{view} = \mathbf{r} \cdot z_{view}
$$

That costs one multiply-add per pixel once you have linear depth.

## Why reversed-Z matters

With standard depth, $d$ behaves like $1 - n/z$, so most of the scene lands very close to 1.0. Floating-point numbers are *least* precise near 1.0. Both effects push precision toward the near plane, which is the main cause of z-fighting in large scenes.

**Reversed-Z** maps near to 1 and far to 0. Now the $1/z$ distribution and the float exponent distribution roughly cancel out, which gives close to uniform relative precision across the whole range. With an infinite far plane it's even simpler:

$$
d = \frac{n}{z_{view}} \quad\Longrightarrow\quad z_{view} = \frac{n}{d}
$$

To use it, set the depth compare to `GREATER`, clear depth to 0 and use a 32-bit float depth buffer. In WebGL2 you'll also want `EXT_clip_control` where available.

## Takeaways

- Know your API's NDC z range before writing any reconstruction code.
- Always divide by $w$ after the inverse projection.
- Use view rays for full-screen passes.
- Use reversed-Z with a float depth buffer unless you have a reason not to.
