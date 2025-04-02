import random
import string
import numpy as np
import seaborn as sns
import matplotlib.pyplot as plt

#text (in lowercase)
# ---------------IMPORTANT------------------------#
# imortant !! to get accurate test results make sure to use lowercase text
txt = "bright clouds gather above silent roads while distant voices echo through empty halls"

def rand_key(l):
    return ''.join(random.choices(string.ascii_lowercase, k=l))

def vig_encrypt(pt, k):
    kl = len(k)
    enc = []
    ki = 0
    
    for ch in pt:
        if ch.isalpha():
            s = ord(k[ki % kl]) - ord('a')
            nc = chr((ord(ch) - ord('a') + s) % 26 + ord('a'))
            enc.append(nc)
            ki += 1
        else:
            enc.append(ch)
    
    return ''.join(enc)

#text lengths to test
txt_lengths = [15, 25, 40, 55, 70, len(txt)]
key_lengths = list(range(2, 9)) 

acc_res = {}

#tests
for tl in reversed(txt_lengths):
    for kl in reversed(key_lengths):
        samp = txt[:tl]  
        rkey = rand_key(kl)  
        enc_txt = vig_encrypt(samp, rkey)  
        
        print(f"\n -- Test Case: Text Length = {tl}, Key Length = {kl}")
        print(f"Key: {rkey}")
        print(f"Encrypted Text: {enc_txt}")

        while True:
            try:
                acc = float(input("Enter decryption accuracy (0-100): "))
                if 0 <= acc <= 100:
                    break
                else:
                    print("enter a number between 0 and 100.")
            except ValueError:
                print("wrong input")

        acc_res[(tl, kl)] = acc

heat_data = np.zeros((len(txt_lengths), len(key_lengths)))

for i, tl in enumerate(txt_lengths):
    for j, kl in enumerate(key_lengths):
        heat_data[i, j] = acc_res.get((tl, kl), 0)

plt.figure(figsize=(10, 6))
sns.heatmap(heat_data, annot=True, fmt=".1f", cmap="coolwarm",
            xticklabels=key_lengths, yticklabels=txt_lengths)

plt.xlabel("Key Length")
plt.ylabel("Text Length")
plt.title("Vigenere Decryption Accuracy Heatmap")
plt.show()
