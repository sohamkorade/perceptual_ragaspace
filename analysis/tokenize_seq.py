def tokenize_seq(seq: str):
    seq = sanitize_seq(seq)
    # group notes with the previous dot or apostrophe
    new_seq = []
    for i in range(len(seq)):
        if i > 0 and seq[i - 1] in ["'", '.']:
            new_seq.append(seq[i - 1] + seq[i])
        elif seq[i] not in ["'", '.']:
            new_seq.append(seq[i])
    return new_seq


def sanitize_seq(seq: str):
    # sanitize the sequence
    import re
    seq = re.sub(r'[^srgmpdnSRGMPDN\.\']', '', seq)
    seq = seq.replace('S', 's')
    seq = seq.replace('P', 'p')
    return seq