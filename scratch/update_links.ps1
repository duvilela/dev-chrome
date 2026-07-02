# Update br/stopram.html
$content = Get-Content -Path "br/stopram.html" -Raw
$content = $content -replace 'href="index.html"', 'href="../index.html"'
$content = $content -replace 'href="zips/stopram.zip"', 'href="../zips/stopram.zip"'
Set-Content -Path "br/stopram.html" -Value $content

# Update br/stopram-telas.html
$content = Get-Content -Path "br/stopram-telas.html" -Raw
$content = $content -replace 'href="index.html"', 'href="../index.html"'
$content = $content -replace 'src="Imagens/', 'src="../Imagens/'
$content = $content -replace 'data-img="Imagens/', 'data-img="../Imagens/'
$content = $content -replace 'dev-chrome/stopram.html', 'dev-chrome/br/stopram.html'
Set-Content -Path "br/stopram-telas.html" -Value $content

# Update br/faq-processes.html
$content = Get-Content -Path "br/faq-processes.html" -Raw
$content = $content -replace 'href="index.html"', 'href="../index.html"'
Set-Content -Path "br/faq-processes.html" -Value $content

# Update br/faq-real-mode.html
$content = Get-Content -Path "br/faq-real-mode.html" -Raw
$content = $content -replace 'href="index.html"', 'href="../index.html"'
Set-Content -Path "br/faq-real-mode.html" -Value $content

# Update br/tips-save-ram.html
$content = Get-Content -Path "br/tips-save-ram.html" -Raw
$content = $content -replace 'href="index.html"', 'href="../index.html"'
Set-Content -Path "br/tips-save-ram.html" -Value $content
