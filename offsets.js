export function calculateOffset(action, direction, frame, withBaseOffset = false) {
    const OFFSETS = {
        base_offset: {
            0: [[0,0],[0,-2],[0,0],[0,-2]],
            1: [[0,0],[0,-2],[0,0],[0,-2]],
            2: [[0,0],[0,-2],[0,0],[0,-2]],
            3: [[0,0],[0,-2],[0,0],[0,-2]]
        },
        walk: {
            0: [[0,0],[0,0],[0,0],[0,0]],
            1: [[0,0],[0,0],[0,0],[0,0]],
            2: [[0,0],[0,0],[0,0],[0,0]],
            3: [[0,0],[0,0],[0,0],[0,0]]
        },
        run: {
            0: [[0,2],[0,6],[0,2],[0,6]],
            1: [[-2,-2],[-2,-2],[-2,-2],[-2,-2]],
            2: [[2,-2],[2,-2],[2,-2],[2,-2]],
            3: [[0,-2],[0,-2],[0,-2],[0,-2]]
        }
        // surf / dive / bike / fish → same as Python
    };

    const table = OFFSETS[action];
    if (!table) return [0,0];

    let [x, y] = table[direction]?.[frame] ?? [0,0];

    if (withBaseOffset) {
        const [bx, by] = OFFSETS.base_offset[direction][frame];
        x += bx;
        y += by;
    }

    return [x, y];
}
