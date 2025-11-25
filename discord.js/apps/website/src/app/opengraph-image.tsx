/* eslint-disable react/no-unknown-property */

import { ImageResponse } from 'next/og';

export const size = {
    width: 1_200,
    height: 630
};

export const contentType = 'image/png';

async function loadGoogleFont(font: string, text: string) {
    const url = `https://fonts.googleapis.com/css2?family=${font}&text=${encodeURIComponent(text)}`;
    const css = await (await fetch(url)).text();

    // eslint-disable-next-line prefer-named-capture-group
    const resource = /src: url\((.+)\) format\('(opentype|truetype)'\)/.exec(css);

    if (resource) {
        const response = await fetch(resource[1]!);

        if (response.status === 200) {
            return response.arrayBuffer();
        }
    }

    throw new Error('falha ao carregar dados de fonte');
}

export default async function Image() {
    return new ImageResponse(
        (
            <div tw="flex bg-[#121214] h-full w-full">
                <div tw="mx-auto flex items-center h-full">
                    <div tw="flex">
                        <div tw="flex">
                            <div tw="flex flex-col font-black text-8xl text-white leading-tight">
                                <div tw="flex flex-row">
                                    a <span tw="bg-[#5865f2] rounded-md px-3 py-2 ml-4 bottom-2">mais popular</span>
                                </div>

                                <span>
                                    maneira de criar
                                </span>

                                <span>
                                    bots do discord.
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        ), {
            ...size,

            fonts: [
                {
                    name: 'Geist',
                    data: await loadGoogleFont('Geist:wght@900', 'a mais popular maneira de criar bots do discord.'),
                    weight: 900,
                    style: 'normal'
                }
            ]
        }
    );
}