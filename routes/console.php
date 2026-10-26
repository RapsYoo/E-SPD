<?php

use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Schedule;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

// Bersihkan file lampiran yatim setiap pekan (membutuhkan `php artisan schedule:run` di cron/Task Scheduler).
Schedule::command('lampiran:bersihkan')->weeklyOn(0, '02:00');
