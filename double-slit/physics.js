/**
 * Converts a visible light wavelength (380nm to 780nm) to RGB values.
 * Returns an object {r, g, b} with values from 0 to 255.
 */
function wavelengthToRGB(wavelength) {
    let r, g, b, factor;

    if (wavelength >= 380 && wavelength < 440) {
        r = -(wavelength - 440) / (440 - 380);
        g = 0.0;
        b = 1.0;
    } else if (wavelength >= 440 && wavelength < 490) {
        r = 0.0;
        g = (wavelength - 440) / (490 - 440);
        b = 1.0;
    } else if (wavelength >= 490 && wavelength < 510) {
        r = 0.0;
        g = 1.0;
        b = -(wavelength - 510) / (510 - 490);
    } else if (wavelength >= 510 && wavelength < 580) {
        r = (wavelength - 510) / (580 - 510);
        g = 1.0;
        b = 0.0;
    } else if (wavelength >= 580 && wavelength < 645) {
        r = 1.0;
        g = -(wavelength - 645) / (645 - 580);
        b = 0.0;
    } else if (wavelength >= 645 && wavelength <= 780) {
        r = 1.0;
        g = 0.0;
        b = 0.0;
    } else {
        r = 0.0;
        g = 0.0;
        b = 0.0;
    }

    // Let the intensity fall off near the vision limits
    if (wavelength >= 380 && wavelength < 420) {
        factor = 0.3 + 0.7 * (wavelength - 380) / (420 - 380);
    } else if (wavelength >= 420 && wavelength < 701) {
        factor = 1.0;
    } else if (wavelength >= 701 && wavelength <= 780) {
        factor = 0.3 + 0.7 * (780 - wavelength) / (780 - 701);
    } else {
        factor = 0.0;
    }

    return {
        r: Math.round(r * factor * 255),
        g: Math.round(g * factor * 255),
        b: Math.round(b * factor * 255)
    };
}

/**
 * Calculates N-slit interference and single-slit diffraction intensity.
 * Equation derived from notebook:
 * I(theta) = I0 * (sin^2(N * beta) / (N^2 * sin^2(beta))) * sinc^2(alpha)
 * where beta = (pi * d * sin(theta)) / lambda
 * and alpha = (pi * a * sin(theta)) / lambda
 */
function calculateNSlitIntensity(N, beta, alpha) {
    // 1. Single Slit Diffraction Factor: sinc^2(alpha)
    let diffraction = 1.0;
    if (Math.abs(alpha) > 0.001) {
        diffraction = Math.pow(Math.sin(alpha) / alpha, 2);
    }

    // 2. N-Slit Interference Factor: sin^2(N * beta) / (N^2 * sin^2(beta))
    let interference = 1.0;
    const sinBeta = Math.sin(beta);

    if (Math.abs(sinBeta) < 0.0001) {
        // Limit as beta -> m * pi is N^2 / N^2 = 1.0 (Primary Maxima)
        interference = 1.0;
    } else {
        const sinNBeta = Math.sin(N * beta);
        interference = Math.pow(sinNBeta / (N * sinBeta), 2);
    }

    return interference * diffraction;
}

/**
 * Calculates Resolving Power R = lambda / delta_lambda = m * N
 */
function calculateResolvingPower(N, m = 1) {
    return m * N;
}