/** Whether the last API request reached the server. False until one fails with a network error; the next response
    (any status) sets it back. Pages read it to show the offline banner and turn editing off. */
export const connection = $state({ offline: false })
