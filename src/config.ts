const inToPixel = 15;
export const Config = {
    InToPixel: inToPixel,
    TableWidth: 39 * inToPixel,
    TableHeight: 79 * inToPixel,
    BallRadius: (2.25 * inToPixel)/2,
    BumperThickness: 20,
    Bounciness: .9
} as const;
