export default async function (data, status = 200) {
    return new Response(
        JSON.stringify(data),
        {
            status: status,
            headers: {
                'content-type': 'application/json',
            },
        }
    )
}