import numpy as np
import skfuzzy as fuzz
from skfuzzy import control as ctrl

# --- 1. Definisi Variabel Input (Antecedent) ---

# Lingkungan (Skala 1-100)
temperature = ctrl.Antecedent(np.arange(1, 101, 1), 'temperature')
humidity = ctrl.Antecedent(np.arange(1, 101, 1), 'humidity')
air_quality = ctrl.Antecedent(np.arange(1, 101, 1), 'air_quality')

# Screentime (Skala 1-23 jam)
total_screentime = ctrl.Antecedent(np.arange(1, 24, 1), 'total screentime')
socialmedia_screentime = ctrl.Antecedent(np.arange(1, 24, 1), 'social media screentime')
entertaiment_screentime = ctrl.Antecedent(np.arange(1, 24, 1), 'entertaiment screentime')
game_screentime = ctrl.Antecedent(np.arange(1, 24, 1), 'game screentime')

# --- 2. Definisi Variabel Output (Consequent) ---

# Output: Kenyamanan/Mood (Skala 0-100, 100 = Sangat Baik)
kenyamanan = ctrl.Consequent(np.arange(0, 101, 1), 'kenyamanan')


# --- 3. Fungsi Keanggotaan (Membership Functions) ---

# Temperature
temperature['Terlalu dingin'] = fuzz.trimf(temperature.universe, [0, 0, 20])
temperature['Dingin'] = fuzz.trimf(temperature.universe, [20, 21, 23])
temperature['Normal'] = fuzz.trimf(temperature.universe, [22, 23, 26])
temperature['Panas'] = fuzz.trimf(temperature.universe, [26, 28, 30])
temperature['Terlalu panas'] = fuzz.trimf(temperature.universe, [30, 100, 100])

# Humidity
# FIX: trap mf membutuhkan 4 titik, bukan 3.
humidity['kering'] = fuzz.trapmf(humidity.universe, [0, 0, 40, 50])
humidity['ideal'] = fuzz.trimf(humidity.universe, [45, 60, 75])
humidity['lembab'] = fuzz.trapmf(humidity.universe, [70, 85, 100, 100])

# Air Quality
air_quality['buruk'] = fuzz.trimf(air_quality.universe, [0, 0, 35])
air_quality['sedang'] = fuzz.trimf(air_quality.universe, [30, 60, 80])
air_quality['bagus'] = fuzz.trimf(air_quality.universe, [75, 100, 100])

# Total Screentime
total_screentime['minimal'] = fuzz.trimf(total_screentime.universe, [1, 1, 6])
total_screentime['wajar'] = fuzz.trimf(total_screentime.universe, [4, 8, 12])
total_screentime['berlebihan'] = fuzz.trimf(total_screentime.universe, [10, 23, 23])

# Social Media Screentime
socialmedia_screentime['sedikit'] = fuzz.trimf(socialmedia_screentime.universe, [1, 1, 3])
socialmedia_screentime['standar'] = fuzz.trimf(socialmedia_screentime.universe, [2, 5, 8])
socialmedia_screentime['banyak'] = fuzz.trimf(socialmedia_screentime.universe, [7, 23, 23])

# Entertaiment Screentime
entertaiment_screentime['rendah'] = fuzz.trimf(entertaiment_screentime.universe, [1, 1, 4])
entertaiment_screentime['tinggi'] = fuzz.trimf(entertaiment_screentime.universe, [3, 23, 23])

# Game Screentime
game_screentime['jarang'] = fuzz.trimf(game_screentime.universe, [1, 1, 2])
game_screentime['sering'] = fuzz.trimf(game_screentime.universe, [1, 23, 23])

# Kenyamanan (Output)
kenyamanan['sangat_rendah'] = fuzz.trimf(kenyamanan.universe, [0, 0, 25])
kenyamanan['rendah'] = fuzz.trimf(kenyamanan.universe, [10, 30, 50])
kenyamanan['netral'] = fuzz.trimf(kenyamanan.universe, [40, 50, 60])
kenyamanan['tinggi'] = fuzz.trimf(kenyamanan.universe, [50, 70, 90])
kenyamanan['sangat_tinggi'] = fuzz.trimf(kenyamanan.universe, [75, 100, 100])


# --- 4. Aturan Fuzzy (Fuzzy Rules) ---

aturan1 = ctrl.Rule(
    (temperature['Normal'] & humidity['ideal'] & air_quality['bagus']) &
    (total_screentime['minimal'] | total_screentime['wajar']), 
    kenyamanan['sangat_tinggi']
)

aturan2 = ctrl.Rule(
    (temperature['Terlalu panas'] | temperature['Terlalu dingin'] | humidity['lembab'] | air_quality['buruk']), 
    kenyamanan['sangat_rendah']
)

aturan3 = ctrl.Rule(
    (total_screentime['berlebihan']) | 
    (socialmedia_screentime['banyak'] & game_screentime['sering']),
    kenyamanan['rendah']
)

aturan4 = ctrl.Rule(
    (air_quality['sedang'] & humidity['ideal']) & 
    (total_screentime['wajar']),
    kenyamanan['netral']
)

aturan5 = ctrl.Rule(
    temperature['Panas'] & entertaiment_screentime['tinggi'],
    kenyamanan['rendah']
)


# --- 5. Sistem Kontrol dan Simulasi ---

kenyamanan_ctrl = ctrl.ControlSystem([aturan1, aturan2, aturan3, aturan4, aturan5])
kenyamanan_simulasi = ctrl.ControlSystemSimulation(kenyamanan_ctrl)

# --- 6. Input dan Komputasi (Testing App) ---

# Contoh Input CRISP (Nilai yang akan diuji)
# PERHATIAN: Variabel input diakses menggunakan kurung siku [].
kenyamanan_simulasi.input['temperature'] = 28  
kenyamanan_simulasi.input['humidity'] = 65    
kenyamanan_simulasi.input['air_quality'] = 85  
kenyamanan_simulasi.input['total screentime'] = 14 
kenyamanan_simulasi.input['social media screentime'] = 7
kenyamanan_simulasi.input['entertaiment screentime'] = 5
kenyamanan_simulasi.input['game screentime'] = 1 

# Menjalankan komputasi
try:
    kenyamanan_simulasi.compute()
    
    # Mengambil hasil defuzzifikasi
    persentase_kenyamanan = kenyamanan_simulasi.output['kenyamanan']

    # Konversi hasil ke Level dan Pesan
    if persentase_kenyamanan >= 75:
        level = "Sangat Baik (Optimal)"
        pesan = "Kombinasi lingkungan dan screentime Anda mendekati ideal. Pertahankan!"
    elif persentase_kenyamanan >= 55:
        level = "Baik (Seimbang)"
        pesan = "Kondisi cukup baik, ada sedikit faktor yang menurunkan mood tapi masih terkendali."
    elif persentase_kenyamanan >= 40:
        level = "Netral (Waspada)"
        pesan = "Ada beberapa faktor signifikan (seperti screentime berlebihan) yang perlu diatasi."
    elif persentase_kenyamanan >= 25:
        level = "Kurang Baik (Perlu Perubahan)"
        pesan = "Banyak faktor yang mengganggu kenyamanan. Segera periksa faktor lingkungan atau batasi screentime."
    else:
        level = "Sangat Rendah (Kritis)"
        pesan = "Faktor lingkungan atau screentime berada di batas ekstrem dan sangat mempengaruhi mood."

    # Tampilkan Hasil. Nilai input harus diakses menggunakan dot notation (.) untuk menghindari error.
    # PERBAIKAN: Mengakses input menggunakan dot notation (misalnya: kenyamanan_simulasi.input.temperature)
    print("--- HASIL SIMULASI FUZZY LOGIC ---")
    print(f"Input: Temp={kenyamanan_simulasi.input.temperature}, Total ST={kenyamanan_simulasi.input['total screentime']}, SM ST={kenyamanan_simulasi.input['social media screentime']}")
    print("-" * 35)
    print(f"Derajat Kenyamanan (Crisp Value): {persentase_kenyamanan:.2f} / 100")
    print(f"Level Kenyamanan: {level}")
    print(f"Pesan: {pesan}")
    
except Exception as e:
    # Mengganti pesan error yang lebih informatif
    print("--- HASIL SIMULASI FUZZY LOGIC ---")
    print(f"Terjadi Error saat komputasi: {e}")
    print("Pastikan semua variabel input sudah diberi nilai.")