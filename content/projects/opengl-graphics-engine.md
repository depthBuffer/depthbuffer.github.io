<!-- TODO: add a hero screenshot or short video, e.g. ![Engine screenshot](/assets/img/projects/engine-hero.jpg) -->
<!-- TODO: if the code is public, add "repo" to this project in data/projects.json -->

## Overview

A personal, ongoing rendering engine written in C++ and OpenGL. Everything above the graphics API is built by hand, from the math library to the material system, so I understand every layer of a modern real-time renderer.

## Architecture

- **Math library.** Vectors, matrices and transformations written from scratch, with no GLM.
- **Render abstraction.** Render buffers and a draw-command layer sit between engine code and raw OpenGL calls.
- **Material pipeline.** Materials configure render state, shaders, uniforms and samplers.
- **Assets.** Mesh and Model classes are built on the Assimp loader.

## Deferred PBR

The engine uses deferred shading. A geometry pass writes surface attributes into a G-buffer, and a lighting pass then shades each pixel once per light. Shading follows the Cook-Torrance microfacet model:

$$
f_r(\mathbf{l}, \mathbf{v}) = \frac{D(\mathbf{h})\,F(\mathbf{v}, \mathbf{h})\,G(\mathbf{l}, \mathbf{v}, \mathbf{h})}{4\,(\mathbf{n}\cdot\mathbf{l})\,(\mathbf{n}\cdot\mathbf{v})}
$$

- $D$ is the normal distribution function.
- $F$ is the Fresnel term.
- $G$ is the geometric shadowing-masking term.

<!-- TODO: say which D/F/G you use (e.g. GGX, Schlick, Smith) and show a material grid screenshot -->

## Post-processing

The lighting pass renders into an HDR target, which then goes through a post-processing stack:

- **SSAO** for contact shadows and ambient occlusion
- **Bloom** for bright highlights
- **Tonemapping** from HDR to display range
- **Gamma correction** for the final output

<!-- TODO: before/after comparison images for SSAO and bloom work well here -->

## Next steps

<!-- TODO: what you're adding next (e.g. shadow mapping, IBL, a Vulkan backend) -->
